-- Fondations additives de la liaison Commandes → Réceptions → Stock.
-- Aucun trigger n'applique de quantité au stock : chaque entrée future devra
-- être prévisualisée et confirmée explicitement par un opérateur.

create table if not exists public.catalogue_stock_liaisons (
  id uuid primary key default gen_random_uuid(),
  -- catalogue.id désigne déjà une variante précise (dimension/grain inclus).
  catalogue_id bigint not null unique references public.catalogue(id) on delete restrict,
  stock_type text not null check (stock_type in (
    'tubes', 'tiges_filetees', 'vis', 'ecrous', 'inserts', 'rivets',
    'forets', 'fraises', 'tarauds'
  )),
  -- Identifiant d'une référence de stock pour les stocks unitaires.
  stock_reference_id bigint null,
  -- Clé logique obligatoire pour les tubes/tiges : elle ne cible jamais une
  -- chute individuelle, mais le groupe de morceaux de la même référence.
  stock_reference_key text null,
  unite_commande text not null check (unite_commande in ('piece', 'boite', 'tube', 'tige')),
  unite_stock text not null check (unite_stock in ('pieces', 'mm')),
  facteur_conversion numeric(14, 4) not null default 1 check (facteur_conversion > 0),
  configuration jsonb not null default '{}'::jsonb,
  libelle_cible text not null,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text null,
  constraint catalogue_stock_liaisons_cible_valide check (
    (stock_type in ('tubes', 'tiges_filetees') and stock_reference_key is not null and stock_reference_id is null and unite_stock = 'mm')
    or
    (stock_type not in ('tubes', 'tiges_filetees') and stock_reference_id is not null and stock_reference_key is null and unite_stock = 'pieces')
  )
);

comment on table public.catalogue_stock_liaisons is
  'Association explicite, vérifiable et par variante entre une ligne catalogue et une référence de stock. Aucune association n''est déduite d''une désignation.';
comment on column public.catalogue_stock_liaisons.configuration is
  'Paramètres validés de la cible : par exemple conditionnement ou caractéristiques de la référence logique. Les longueurs reçues restent saisies lors de la confirmation.';

create index if not exists catalogue_stock_liaisons_stock_target_idx
  on public.catalogue_stock_liaisons(stock_type, stock_reference_id)
  where stock_reference_id is not null;
create index if not exists catalogue_stock_liaisons_stock_key_idx
  on public.catalogue_stock_liaisons(stock_type, stock_reference_key)
  where stock_reference_key is not null;

-- Une opération est le dossier de préparation d'une ligne réellement reçue.
-- Elle est distincte de l'historique : tant qu'elle n'est pas appliquée, elle
-- ne modifie aucune table de stock ni aucun mouvement existant.
create table if not exists public.reception_stock_operations (
  id uuid primary key default gen_random_uuid(),
  commande_reception_ligne_id uuid not null unique references public.commande_reception_lignes(id) on delete restrict,
  catalogue_stock_liaison_id uuid null references public.catalogue_stock_liaisons(id) on delete restrict,
  statut text not null default 'en_attente_liaison' check (statut in (
    'en_attente_liaison', 'prete_a_confirmer', 'appliquee', 'ignoree', 'erreur'
  )),
  stock_type text null check (stock_type is null or stock_type in (
    'tubes', 'tiges_filetees', 'vis', 'ecrous', 'inserts', 'rivets',
    'forets', 'fraises', 'tarauds'
  )),
  stock_reference_id bigint null,
  stock_reference_key text null,
  unite_commande text null,
  unite_stock text null check (unite_stock is null or unite_stock in ('pieces', 'mm')),
  quantite_recue integer not null check (quantite_recue > 0),
  quantite_a_ajouter numeric(14, 4) null check (quantite_a_ajouter is null or quantite_a_ajouter > 0),
  details_reception jsonb not null default '{}'::jsonb,
  stock_avant jsonb null,
  stock_apres jsonb null,
  application_idempotency_key uuid unique null,
  appliquee_le timestamptz null,
  appliquee_par text null,
  erreur text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reception_stock_operations_application_coherente check (
    (statut = 'appliquee' and appliquee_le is not null and quantite_a_ajouter is not null)
    or statut <> 'appliquee'
  )
);

comment on table public.reception_stock_operations is
  'Prévisualisation et verrou d''idempotence pour une application manuelle au stock. Une seule opération peut exister par ligne de réception.';

create index if not exists reception_stock_operations_statut_idx
  on public.reception_stock_operations(statut, created_at desc);
create index if not exists reception_stock_operations_liaison_idx
  on public.reception_stock_operations(catalogue_stock_liaison_id)
  where catalogue_stock_liaison_id is not null;

-- Historique applicatif dédié aux entrées issues de commandes. Il complète les
-- historiques physiques existants sans les modifier ni les dupliquer.
create table if not exists public.reception_stock_mouvements (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null unique references public.reception_stock_operations(id) on delete restrict,
  commande_id uuid not null references public.commandes(id) on delete restrict,
  reception_id uuid not null references public.commande_receptions(id) on delete restrict,
  commande_reception_ligne_id uuid not null references public.commande_reception_lignes(id) on delete restrict,
  catalogue_stock_liaison_id uuid null references public.catalogue_stock_liaisons(id) on delete restrict,
  stock_type text not null,
  stock_reference_id bigint null,
  stock_reference_key text null,
  quantite_ajoutee numeric(14, 4) not null check (quantite_ajoutee > 0),
  unite text not null check (unite in ('pieces', 'mm')),
  stock_avant jsonb not null,
  stock_apres jsonb not null,
  details jsonb not null default '{}'::jsonb,
  valide_par text null,
  date_mouvement timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.reception_stock_mouvements is
  'Traçabilité immutable des entrées de stock validées depuis une réception de commande.';

create index if not exists reception_stock_mouvements_commande_idx
  on public.reception_stock_mouvements(commande_id, date_mouvement desc);
create index if not exists reception_stock_mouvements_target_idx
  on public.reception_stock_mouvements(stock_type, stock_reference_id, stock_reference_key);

-- Ces tables ne sont jamais accessibles par la clé publique : les futures
-- prévisualisations et validations passeront par des routes serveur dédiées.
alter table public.catalogue_stock_liaisons enable row level security;
alter table public.reception_stock_operations enable row level security;
alter table public.reception_stock_mouvements enable row level security;

revoke all on table public.catalogue_stock_liaisons from anon, authenticated;
revoke all on table public.reception_stock_operations from anon, authenticated;
revoke all on table public.reception_stock_mouvements from anon, authenticated;

grant all on table public.catalogue_stock_liaisons to service_role;
grant all on table public.reception_stock_operations to service_role;
grant all on table public.reception_stock_mouvements to service_role;
