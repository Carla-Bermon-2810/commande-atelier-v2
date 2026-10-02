-- Caractéristique additive des vis : aucune quantité, aucun seuil et aucun
-- historique existant n'est modifié. Les anciennes références restent nulles.
alter table public.stock_vis
  add column if not exists type_tete text;

comment on column public.stock_vis.type_tete is
  'Type de tête de vis : FHC, BHC, CHC ou TH. Nullable pour les références historiques.';

alter table public.stock_vis
  drop constraint if exists stock_vis_type_tete_valide;

alter table public.stock_vis
  add constraint stock_vis_type_tete_valide
  check (type_tete is null or type_tete in ('FHC', 'BHC', 'CHC', 'TH'));
