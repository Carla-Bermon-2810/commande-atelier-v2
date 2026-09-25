-- Phase 4 — seuils centralisés pour les stocks de longueur.
-- Une chute ne porte jamais son propre seuil : le seuil est rattaché à la
-- référence logique, ce qui permet d'additionner toutes les longueurs restantes.

create table if not exists public.stock_seuils_longueur (
  source text not null check (source in ('tubes', 'tiges_filetees')),
  reference_key text not null,
  seuil_mm integer not null check (seuil_mm >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source, reference_key)
);

comment on table public.stock_seuils_longueur is
  'Seuils d''alerte exprimés uniquement en millimètres, par référence logique de tube ou tige filetée.';

alter table public.stock_seuils_longueur enable row level security;

-- Cette table de paramétrage est lue uniquement côté serveur. Les opérateurs
-- publics ne peuvent ni voir ni modifier les seuils par l''API de données.
revoke all on table public.stock_seuils_longueur from anon, authenticated;
grant all on table public.stock_seuils_longueur to service_role;
