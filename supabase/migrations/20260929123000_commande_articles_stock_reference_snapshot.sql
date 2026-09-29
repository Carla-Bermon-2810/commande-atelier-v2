-- Identité stock immuable conservée pour une commande créée depuis le Stock.
-- Nullable afin de préserver les commandes historiques et hors catalogue.
alter table public.commande_articles
  add column if not exists stock_reference_snapshot jsonb;

comment on column public.commande_articles.stock_reference_snapshot is
  'Snapshot de la référence Stock exacte, de son unité et de sa conversion au moment de la commande.';
