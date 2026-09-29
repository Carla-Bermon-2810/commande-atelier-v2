-- Référentiel technique commun Catalogue / Stock.
-- Cette migration ne modifie aucune quantité, réception ou historique.
-- Elle crée des identités internes indépendantes tant qu'une association
-- Catalogue ↔ Stock n'est pas démontrée par un identifiant fiable.

create table if not exists public.references_metier (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  source_catalogue_id bigint unique null references public.catalogue(id) on delete restrict,
  stock_type text null check (stock_type is null or stock_type in (
    'tubes', 'tiges_filetees', 'vis', 'ecrous', 'inserts', 'rivets',
    'forets', 'fraises', 'tarauds'
  )),
  stock_reference_id bigint null,
  stock_reference_key text null,
  statut text not null default 'catalogue_seul' check (statut in ('catalogue_seul', 'stock_seul', 'commun')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint references_metier_cible_stock_coherente check (
    (stock_type is null and stock_reference_id is null and stock_reference_key is null)
    or (stock_type in ('tubes', 'tiges_filetees') and stock_reference_id is null and stock_reference_key is not null)
    or (stock_type not in ('tubes', 'tiges_filetees') and stock_reference_id is not null and stock_reference_key is null)
  )
);

create unique index if not exists references_metier_stock_id_unique
  on public.references_metier(stock_type, stock_reference_id)
  where stock_reference_id is not null;
create unique index if not exists references_metier_stock_key_unique
  on public.references_metier(stock_type, stock_reference_key)
  where stock_reference_key is not null;

alter table public.catalogue add column if not exists reference_metier_id uuid null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'catalogue_reference_metier_id_fkey'
  ) then
    alter table public.catalogue
      add constraint catalogue_reference_metier_id_fkey
      foreign key (reference_metier_id) references public.references_metier(id) on delete restrict;
  end if;
end $$;

create index if not exists catalogue_reference_metier_idx
  on public.catalogue(reference_metier_id)
  where reference_metier_id is not null;

-- Une identité est créée pour chaque référence Stock existante, sans modifier
-- les lignes de stock ni les regrouper.
insert into public.references_metier (code, stock_type, stock_reference_id, statut)
select 'STK-VIS-' || id, 'vis', id, 'stock_seul' from public.stock_vis
on conflict (code) do nothing;
insert into public.references_metier (code, stock_type, stock_reference_id, statut)
select 'STK-ECROU-' || id, 'ecrous', id, 'stock_seul' from public.stock_ecrous
on conflict (code) do nothing;
insert into public.references_metier (code, stock_type, stock_reference_id, statut)
select 'STK-INSERT-' || id, 'inserts', id, 'stock_seul' from public.stock_inserts
on conflict (code) do nothing;
insert into public.references_metier (code, stock_type, stock_reference_id, statut)
select 'STK-RIVET-' || id, 'rivets', id, 'stock_seul' from public.stock_rivets
on conflict (code) do nothing;
insert into public.references_metier (code, stock_type, stock_reference_id, statut)
select 'STK-FORET-' || id, 'forets', id, 'stock_seul' from public.stock_forets
on conflict (code) do nothing;
insert into public.references_metier (code, stock_type, stock_reference_id, statut)
select 'STK-FRAISE-' || id, 'fraises', id, 'stock_seul' from public.stock_fraises
on conflict (code) do nothing;
insert into public.references_metier (code, stock_type, stock_reference_id, statut)
select 'STK-TARAUD-' || id, 'tarauds', id, 'stock_seul' from public.stock_tarauds
on conflict (code) do nothing;

with groupes as (
  select distinct lower(trim(matiere)) || '|' || lower(trim(type)) || '|' || lower(trim(section)) || '|' || coalesce(epaisseur::text, '') || '|' || lower(trim(coalesce(nuance, ''))) as cle
  from public.stock_tubes
)
insert into public.references_metier (code, stock_type, stock_reference_key, statut)
select 'STK-TUBE-' || md5(cle), 'tubes', cle, 'stock_seul' from groupes
on conflict (code) do nothing;

with groupes as (
  select distinct lower(trim(matiere)) || '|' || lower(case when trim(diametre) like 'Ø%' then replace(trim(diametre), ' ', '') else 'Ø' || replace(trim(diametre), ' ', '') end) as cle
  from public.stock_tiges_filetees
)
insert into public.references_metier (code, stock_type, stock_reference_key, statut)
select 'STK-TIGE-' || md5(cle), 'tiges_filetees', cle, 'stock_seul' from groupes
on conflict (code) do nothing;

-- Chaque variante Catalogue reçoit automatiquement sa propre identité tant
-- qu'elle n'est pas reliée à une référence Stock démontrée.
insert into public.references_metier (code, source_catalogue_id, statut)
select 'CAT-' || id, id, 'catalogue_seul'
from public.catalogue
where reference_metier_id is null
on conflict (code) do nothing;

update public.catalogue catalogue
set reference_metier_id = reference_metier.id
from public.references_metier reference_metier
where reference_metier.source_catalogue_id = catalogue.id
  and catalogue.reference_metier_id is null;

create or replace function public.attribuer_reference_metier_catalogue()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reference_id uuid;
begin
  insert into public.references_metier (code, source_catalogue_id, statut)
  values ('CAT-' || new.id, new.id, 'catalogue_seul')
  on conflict (source_catalogue_id) do update set updated_at = now()
  returning id into reference_id;

  update public.catalogue
  set reference_metier_id = reference_id
  where id = new.id and reference_metier_id is null;

  return new;
end;
$$;

drop trigger if exists catalogue_attribuer_reference_metier on public.catalogue;
create trigger catalogue_attribuer_reference_metier
after insert on public.catalogue
for each row execute function public.attribuer_reference_metier_catalogue();

alter table public.catalogue_stock_liaisons
  add column if not exists reference_metier_id uuid null references public.references_metier(id) on delete restrict;
create index if not exists catalogue_stock_liaisons_reference_metier_idx
  on public.catalogue_stock_liaisons(reference_metier_id)
  where reference_metier_id is not null;

comment on table public.references_metier is
  'Identité interne stable d''une variante Catalogue ou d''une référence Stock. Une référence ne devient commune qu''après une association explicitement prouvée.';

alter table public.references_metier enable row level security;
revoke all on table public.references_metier from anon, authenticated;
grant all on table public.references_metier to service_role;
