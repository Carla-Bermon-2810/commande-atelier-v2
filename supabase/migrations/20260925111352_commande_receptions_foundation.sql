-- Phase 2 — fondations du suivi des commandes et des réceptions.
-- Cette migration est additive : les commandes et lignes historiques restent
-- lisibles et continuent d'utiliser leurs colonnes existantes.

do $$
begin
  if (select data_type from information_schema.columns
      where table_schema = 'public' and table_name = 'commandes' and column_name = 'id') <> 'uuid'
     or (select data_type from information_schema.columns
         where table_schema = 'public' and table_name = 'commande_articles' and column_name = 'id') <> 'uuid' then
    raise exception 'Les identifiants de commandes doivent être de type uuid pour appliquer cette migration.';
  end if;
end;
$$;

alter table public.commande_articles
  add column if not exists catalogue_id bigint null references public.catalogue(id) on delete set null,
  add column if not exists designation_snapshot text null,
  add column if not exists variante_snapshot text null,
  add column if not exists photo_snapshot text null,
  add column if not exists unite_snapshot text null;

comment on column public.commande_articles.catalogue_id is
  'Lien optionnel vers le catalogue. Le libellé commandé reste stocké dans les snapshots pour préserver l''historique.';

create index if not exists commande_articles_catalogue_id_idx
  on public.commande_articles(catalogue_id)
  where catalogue_id is not null;

alter table public.commandes
  add column if not exists annulee_le timestamptz null,
  add column if not exists annulee_par text null,
  add column if not exists motif_annulation text null;

create table if not exists public.commande_receptions (
  id uuid primary key default gen_random_uuid(),
  commande_id uuid not null references public.commandes(id) on delete restrict,
  commentaire text null,
  enregistre_par text null,
  idempotency_key uuid not null unique,
  date_reception timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint commande_receptions_commentaire_length
    check (commentaire is null or char_length(commentaire) <= 1000),
  constraint commande_receptions_enregistre_par_length
    check (enregistre_par is null or char_length(enregistre_par) <= 100)
);

create index if not exists commande_receptions_commande_date_idx
  on public.commande_receptions(commande_id, date_reception desc);

create table if not exists public.commande_reception_lignes (
  id uuid primary key default gen_random_uuid(),
  reception_id uuid not null references public.commande_receptions(id) on delete restrict,
  commande_article_id uuid not null references public.commande_articles(id) on delete restrict,
  quantite_recue integer not null check (quantite_recue > 0 and quantite_recue <= 10000),
  created_at timestamptz not null default now(),
  constraint commande_reception_lignes_unique_line unique(reception_id, commande_article_id)
);

create index if not exists commande_reception_lignes_commande_article_idx
  on public.commande_reception_lignes(commande_article_id);

-- Verrouille la ligne commandée afin que deux réceptions simultanées ne
-- puissent pas dépasser la quantité commandée. La quantité reçue cumulée est
-- volontairement dérivée de la somme des lignes de réception.
create or replace function public.verifier_ligne_reception_commande()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_commande_id uuid;
  v_quantite_commandee integer;
  v_commande_reception_id uuid;
  v_deja_recu integer;
begin
  select ca.commande_id, ca.quantite
    into v_commande_id, v_quantite_commandee
  from public.commande_articles ca
  where ca.id = new.commande_article_id
  for update;

  if not found then
    raise exception 'Ligne de commande introuvable.';
  end if;

  select cr.commande_id
    into v_commande_reception_id
  from public.commande_receptions cr
  where cr.id = new.reception_id;

  if not found or v_commande_reception_id <> v_commande_id then
    raise exception 'La ligne reçue ne correspond pas à la commande de cette réception.';
  end if;

  select coalesce(sum(crl.quantite_recue), 0)
    into v_deja_recu
  from public.commande_reception_lignes crl
  where crl.commande_article_id = new.commande_article_id
    and crl.id is distinct from new.id;

  if v_deja_recu + new.quantite_recue > v_quantite_commandee then
    raise exception 'La quantité reçue dépasse la quantité commandée pour cette ligne.';
  end if;

  return new;
end;
$$;

drop trigger if exists verifier_ligne_reception_commande_trigger on public.commande_reception_lignes;
create trigger verifier_ligne_reception_commande_trigger
  before insert or update of reception_id, commande_article_id, quantite_recue
  on public.commande_reception_lignes
  for each row execute function public.verifier_ligne_reception_commande();

-- Point d'entrée transactionnel réservé au serveur. Il garde un historique de
-- chaque réception et protège les doubles validations avec une clé d'idempotence.
create or replace function public.enregistrer_reception_commande(
  p_commande_id uuid,
  p_lignes jsonb,
  p_commentaire text default null,
  p_enregistre_par text default null,
  p_idempotency_key uuid default gen_random_uuid()
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_reception_id uuid;
  v_existing_commande_id uuid;
begin
  if jsonb_typeof(p_lignes) <> 'array' or jsonb_array_length(p_lignes) = 0 then
    raise exception 'Au moins une quantité reçue est requise.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_lignes) as ligne(commande_article_id uuid, quantite_recue integer)
    where ligne.commande_article_id is null
       or ligne.quantite_recue is null
       or ligne.quantite_recue <= 0
       or ligne.quantite_recue > 10000
  ) then
    raise exception 'Les lignes de réception sont invalides.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_lignes) as ligne(commande_article_id uuid, quantite_recue integer)
    group by ligne.commande_article_id
    having count(*) > 1
  ) then
    raise exception 'Une ligne de commande ne peut être reçue qu''une fois par réception.';
  end if;

  select cr.id, cr.commande_id
    into v_reception_id, v_existing_commande_id
  from public.commande_receptions cr
  where cr.idempotency_key = p_idempotency_key;

  if found then
    if v_existing_commande_id <> p_commande_id then
      raise exception 'Cette clé de validation appartient déjà à une autre commande.';
    end if;
    return v_reception_id;
  end if;

  perform 1
  from public.commandes c
  where c.id = p_commande_id
    and c.annulee_le is null
  for update;

  if not found then
    raise exception 'Commande introuvable ou annulée.';
  end if;

  insert into public.commande_receptions (commande_id, commentaire, enregistre_par, idempotency_key)
  values (
    p_commande_id,
    nullif(btrim(coalesce(p_commentaire, '')), ''),
    nullif(btrim(coalesce(p_enregistre_par, '')), ''),
    p_idempotency_key
  )
  returning id into v_reception_id;

  insert into public.commande_reception_lignes (reception_id, commande_article_id, quantite_recue)
  select v_reception_id, ligne.commande_article_id, ligne.quantite_recue
  from jsonb_to_recordset(p_lignes) as ligne(commande_article_id uuid, quantite_recue integer)
  order by ligne.commande_article_id;

  return v_reception_id;
end;
$$;

-- Les réceptions ne sont accessibles ni via la clé publique ni par Data API.
-- L'application passe exclusivement par ses routes serveur avec la clé secrète.
alter table public.commande_receptions enable row level security;
alter table public.commande_reception_lignes enable row level security;

revoke all on table public.commande_receptions from anon, authenticated;
revoke all on table public.commande_reception_lignes from anon, authenticated;
grant all on table public.commande_receptions to service_role;
grant all on table public.commande_reception_lignes to service_role;

revoke execute on function public.enregistrer_reception_commande(uuid, jsonb, text, text, uuid) from public, anon, authenticated;
grant execute on function public.enregistrer_reception_commande(uuid, jsonb, text, text, uuid) to service_role;
