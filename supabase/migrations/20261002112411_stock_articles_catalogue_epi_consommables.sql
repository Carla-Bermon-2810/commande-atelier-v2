-- Extension additive du Stock Catalogue générique : EPI et Consommables.
-- Les références sont importées à initialiser : aucune quantité, aucun seuil,
-- aucun mouvement ni lien actif vers une commande historique n'est créé ici.

begin;

alter table public.stock_articles_catalogue
  drop constraint if exists stock_articles_catalogue_stock_type_check;
alter table public.stock_articles_catalogue
  add constraint stock_articles_catalogue_stock_type_check
  check (stock_type in ('abrasifs', 'soudure', 'epi', 'consommables'));

comment on table public.stock_articles_catalogue is
  'Références Catalogue suivies dans le Stock pour les Abrasifs, la Soudure, les EPI et les Consommables. Les quantités restent NULL tant qu''une référence n''a pas été initialisée explicitement.';

alter table public.references_metier
  drop constraint if exists references_metier_cible_stock_coherente,
  drop constraint if exists references_metier_stock_type_check;
alter table public.references_metier
  add constraint references_metier_stock_type_check check (stock_type is null or stock_type in (
    'tubes', 'tiges_filetees', 'vis', 'ecrous', 'inserts', 'rivets',
    'forets', 'fraises', 'tarauds', 'abrasifs', 'soudure', 'epi', 'consommables'
  )),
  add constraint references_metier_cible_stock_coherente check (
    (stock_type is null and stock_reference_id is null and stock_reference_key is null)
    or (stock_type in ('tubes', 'tiges_filetees') and stock_reference_id is null and stock_reference_key is not null)
    or (stock_type in ('vis', 'ecrous', 'inserts', 'rivets', 'forets', 'fraises', 'tarauds', 'abrasifs', 'soudure', 'epi', 'consommables') and stock_reference_id is not null and stock_reference_key is null)
  );

alter table public.catalogue_stock_liaisons
  drop constraint if exists catalogue_stock_liaisons_cible_valide,
  drop constraint if exists catalogue_stock_liaisons_stock_type_check;
alter table public.catalogue_stock_liaisons
  add constraint catalogue_stock_liaisons_stock_type_check check (stock_type in (
    'tubes', 'tiges_filetees', 'vis', 'ecrous', 'inserts', 'rivets',
    'forets', 'fraises', 'tarauds', 'abrasifs', 'soudure', 'epi', 'consommables'
  )),
  add constraint catalogue_stock_liaisons_cible_valide check (
    (stock_type in ('tubes', 'tiges_filetees') and stock_reference_key is not null and stock_reference_id is null and unite_stock = 'mm')
    or (stock_type in ('vis', 'ecrous', 'inserts', 'rivets', 'forets', 'fraises', 'tarauds') and stock_reference_id is not null and stock_reference_key is null and unite_stock = 'pieces')
    or (stock_type in ('abrasifs', 'soudure', 'epi', 'consommables') and stock_reference_id is not null and stock_reference_key is null and unite_stock = 'unites')
  );

alter table public.reception_stock_operations
  drop constraint if exists reception_stock_operations_stock_type_check;
alter table public.reception_stock_operations
  add constraint reception_stock_operations_stock_type_check check (stock_type is null or stock_type in (
    'tubes', 'tiges_filetees', 'vis', 'ecrous', 'inserts', 'rivets',
    'forets', 'fraises', 'tarauds', 'abrasifs', 'soudure', 'epi', 'consommables'
  ));

-- Une identité Catalogue est créée uniquement pour les lignes qui n'en ont pas
-- encore. La correspondance repose exclusivement sur catalogue.id.
insert into public.references_metier (code, source_catalogue_id, statut)
select 'CAT-' || catalogue.id, catalogue.id, 'catalogue_seul'
from public.catalogue catalogue
where catalogue.reference_metier_id is null
  and lower(btrim(catalogue.categorie)) in ('epi', 'consommable', 'consommables')
on conflict (code) do nothing;

update public.catalogue catalogue
set reference_metier_id = reference_metier.id
from public.references_metier reference_metier
where reference_metier.source_catalogue_id = catalogue.id
  and catalogue.reference_metier_id is null
  and lower(btrim(catalogue.categorie)) in ('epi', 'consommable', 'consommables');

-- Import idempotent : chaque ligne conserve ses snapshots Catalogue. Les
-- conditionnements éventuellement écrits dans « dimension » ne sont jamais
-- interprétés ni transformés ici.
with cibles as (
  select catalogue.id as catalogue_id, catalogue.reference_metier_id,
    case when lower(btrim(catalogue.categorie)) = 'epi' then 'epi' else 'consommables' end as stock_type,
    catalogue.categorie, catalogue.famille, catalogue.produit, catalogue.grain,
    catalogue.dimension, catalogue.photo, catalogue.description
  from public.catalogue catalogue
  where lower(btrim(catalogue.categorie)) in ('epi', 'consommable', 'consommables')
)
insert into public.stock_articles_catalogue (
  catalogue_id, reference_metier_id, stock_type,
  categorie_catalogue_snapshot, famille_catalogue_snapshot, designation_snapshot,
  caracteristique_snapshot, dimension_snapshot, photo_snapshot, description_snapshot
)
select catalogue_id, reference_metier_id, stock_type,
  coalesce(categorie, ''), coalesce(famille, ''), coalesce(produit, ''),
  nullif(btrim(grain), ''), nullif(btrim(dimension), ''), nullif(btrim(photo), ''), nullif(btrim(description), '')
from cibles
where reference_metier_id is not null
on conflict (catalogue_id) do update
set stock_type = excluded.stock_type,
    categorie_catalogue_snapshot = excluded.categorie_catalogue_snapshot,
    famille_catalogue_snapshot = excluded.famille_catalogue_snapshot,
    designation_snapshot = excluded.designation_snapshot,
    caracteristique_snapshot = excluded.caracteristique_snapshot,
    dimension_snapshot = excluded.dimension_snapshot,
    photo_snapshot = excluded.photo_snapshot,
    description_snapshot = excluded.description_snapshot,
    updated_at = now();

create or replace function public.appliquer_reception_stock_article_catalogue_operation(
  p_operation_id uuid,
  p_appliquee_par text default null,
  p_application_idempotency_key uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_operation public.reception_stock_operations%rowtype;
  v_article public.stock_articles_catalogue%rowtype;
  v_reception_id uuid; v_commande_id uuid; v_before numeric; v_after numeric; v_added numeric;
  v_before_json jsonb; v_after_json jsonb;
begin
  select * into v_operation from public.reception_stock_operations where id = p_operation_id for update;
  if not found then raise exception 'Opération de réception introuvable.' using errcode = 'P0002'; end if;
  if v_operation.statut = 'appliquee' then return jsonb_build_object('status', 'already_applied', 'operationId', v_operation.id); end if;
  if v_operation.statut <> 'prete_a_confirmer' or v_operation.stock_type not in ('abrasifs', 'soudure', 'epi', 'consommables') then raise exception 'Cette opération générique ne peut pas être confirmée.' using errcode = 'P0001'; end if;
  if p_application_idempotency_key is null or v_operation.stock_reference_id is null or v_operation.quantite_a_ajouter is null then raise exception 'La confirmation nécessite une référence, une quantité et une clé d''idempotence.' using errcode = 'P0001'; end if;
  select ligne.reception_id, reception.commande_id into v_reception_id, v_commande_id from public.commande_reception_lignes ligne join public.commande_receptions reception on reception.id = ligne.reception_id where ligne.id = v_operation.commande_reception_ligne_id;
  if not found then raise exception 'Réception source introuvable.' using errcode = 'P0002'; end if;
  select * into v_article from public.stock_articles_catalogue where id = v_operation.stock_reference_id for update;
  if not found or v_article.etat_initialisation <> 'initialise' or v_article.quantite_disponible is null then raise exception 'La référence Stock n''est plus initialisée.' using errcode = 'P0001'; end if;
  if v_article.stock_type <> v_operation.stock_type then raise exception 'La référence Stock ne correspond pas à l''opération.' using errcode = 'P0001'; end if;
  v_before := v_article.quantite_disponible; v_added := v_operation.quantite_a_ajouter; v_after := v_before + v_added;
  v_before_json := jsonb_build_object('unites', v_before); v_after_json := jsonb_build_object('unites', v_after);
  update public.stock_articles_catalogue set quantite_disponible = v_after, updated_at = now() where id = v_article.id;
  update public.reception_stock_operations set statut = 'appliquee', stock_avant = v_before_json, stock_apres = v_after_json, application_idempotency_key = p_application_idempotency_key, appliquee_le = now(), appliquee_par = nullif(btrim(p_appliquee_par), ''), erreur = null, updated_at = now() where id = v_operation.id;
  insert into public.reception_stock_mouvements(operation_id, commande_id, reception_id, commande_reception_ligne_id, catalogue_stock_liaison_id, stock_type, stock_reference_id, stock_reference_key, quantite_ajoutee, unite, stock_avant, stock_apres, details, valide_par)
  values (v_operation.id, v_commande_id, v_reception_id, v_operation.commande_reception_ligne_id, v_operation.catalogue_stock_liaison_id, v_operation.stock_type, v_operation.stock_reference_id, null, v_added, 'unites', v_before_json, v_after_json, jsonb_build_object('quantite_recue', v_operation.quantite_recue, 'unite_commande', v_operation.unite_commande, 'configuration', coalesce(v_operation.details_reception->'configuration', '{}'::jsonb)), nullif(btrim(p_appliquee_par), ''));
  return jsonb_build_object('status', 'applied', 'operationId', v_operation.id, 'stockAvant', v_before_json, 'stockApres', v_after_json, 'quantiteAjoutee', v_added, 'unite', 'unites');
end;
$$;

revoke all on function public.appliquer_reception_stock_article_catalogue_operation(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.appliquer_reception_stock_article_catalogue_operation(uuid, text, uuid) to service_role;

commit;
