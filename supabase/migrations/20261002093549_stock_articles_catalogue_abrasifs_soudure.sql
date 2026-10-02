-- Stock Catalogue générique : Abrasifs et Soudure
--
-- Cette migration est strictement additive. Elle importe les références
-- Catalogue comme références Stock « à initialiser » sans créer de quantité,
-- seuil, alerte, mouvement ni liaison active vers les commandes existantes.

begin;

create table if not exists public.stock_articles_catalogue (
  id bigint generated always as identity primary key,
  catalogue_id bigint not null unique references public.catalogue(id) on delete restrict,
  reference_metier_id uuid not null unique references public.references_metier(id) on delete restrict,
  stock_type text not null check (stock_type in ('abrasifs', 'soudure')),
  categorie_catalogue_snapshot text not null,
  famille_catalogue_snapshot text not null,
  designation_snapshot text not null,
  caracteristique_snapshot text null,
  dimension_snapshot text null,
  photo_snapshot text null,
  description_snapshot text null,
  etat_initialisation text not null default 'a_initialiser'
    check (etat_initialisation in ('a_initialiser', 'initialise')),
  -- L’unité technique est volontairement inconnue avant initialisation :
  -- « 0 » ou « pièce » ne sont jamais des valeurs déduites du Catalogue.
  unite_technique text null check (unite_technique is null or unite_technique = 'unites'),
  unite_libelle text null,
  conditionnement_label text null,
  unite_commande text null check (unite_commande is null or unite_commande = 'unite'),
  facteur_conversion numeric(14, 4) null check (facteur_conversion is null or facteur_conversion > 0),
  quantite_disponible numeric(14, 4) null check (quantite_disponible is null or quantite_disponible >= 0),
  seuil_minimum numeric(14, 4) null check (seuil_minimum is null or seuil_minimum >= 0),
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stock_articles_catalogue_initialisation_coherente check (
    (etat_initialisation = 'a_initialiser'
      and unite_technique is null
      and unite_commande is null
      and facteur_conversion is null
      and quantite_disponible is null
      and seuil_minimum is null)
    or
    (etat_initialisation = 'initialise'
      and unite_technique = 'unites'
      and unite_commande = 'unite'
      and facteur_conversion is not null
      and quantite_disponible is not null
      and seuil_minimum is not null)
  )
);

create index if not exists stock_articles_catalogue_type_famille_idx
  on public.stock_articles_catalogue(stock_type, famille_catalogue_snapshot);
create index if not exists stock_articles_catalogue_initialisation_idx
  on public.stock_articles_catalogue(etat_initialisation, stock_type);

comment on table public.stock_articles_catalogue is
  'Références Catalogue suivies dans le Stock pour les Abrasifs et la Soudure. Les quantités restent NULL tant qu''une référence n''a pas été initialisée explicitement.';

-- Les types supplémentaires sont ajoutés aux fondations techniques sans
-- modifier les liens ou opérations déjà présents.
alter table public.references_metier
  drop constraint if exists references_metier_cible_stock_coherente,
  drop constraint if exists references_metier_stock_type_check;
alter table public.references_metier
  add constraint references_metier_stock_type_check check (stock_type is null or stock_type in (
    'tubes', 'tiges_filetees', 'vis', 'ecrous', 'inserts', 'rivets',
    'forets', 'fraises', 'tarauds', 'abrasifs', 'soudure'
  )),
  add constraint references_metier_cible_stock_coherente check (
    (stock_type is null and stock_reference_id is null and stock_reference_key is null)
    or (stock_type in ('tubes', 'tiges_filetees') and stock_reference_id is null and stock_reference_key is not null)
    or (stock_type in ('vis', 'ecrous', 'inserts', 'rivets', 'forets', 'fraises', 'tarauds', 'abrasifs', 'soudure') and stock_reference_id is not null and stock_reference_key is null)
  );

alter table public.catalogue_stock_liaisons
  drop constraint if exists catalogue_stock_liaisons_cible_valide,
  drop constraint if exists catalogue_stock_liaisons_stock_type_check,
  drop constraint if exists catalogue_stock_liaisons_unite_commande_check,
  drop constraint if exists catalogue_stock_liaisons_unite_stock_check;
alter table public.catalogue_stock_liaisons
  add constraint catalogue_stock_liaisons_stock_type_check check (stock_type in (
    'tubes', 'tiges_filetees', 'vis', 'ecrous', 'inserts', 'rivets',
    'forets', 'fraises', 'tarauds', 'abrasifs', 'soudure'
  )),
  add constraint catalogue_stock_liaisons_unite_commande_check check (unite_commande in ('piece', 'boite', 'tube', 'tige', 'unite')),
  add constraint catalogue_stock_liaisons_unite_stock_check check (unite_stock in ('pieces', 'mm', 'unites')),
  add constraint catalogue_stock_liaisons_cible_valide check (
    (stock_type in ('tubes', 'tiges_filetees') and stock_reference_key is not null and stock_reference_id is null and unite_stock = 'mm')
    or (stock_type in ('vis', 'ecrous', 'inserts', 'rivets', 'forets', 'fraises', 'tarauds') and stock_reference_id is not null and stock_reference_key is null and unite_stock = 'pieces')
    or (stock_type in ('abrasifs', 'soudure') and stock_reference_id is not null and stock_reference_key is null and unite_stock = 'unites')
  );

alter table public.reception_stock_operations
  drop constraint if exists reception_stock_operations_stock_type_check,
  drop constraint if exists reception_stock_operations_unite_stock_check;
alter table public.reception_stock_operations
  add constraint reception_stock_operations_stock_type_check check (stock_type is null or stock_type in (
    'tubes', 'tiges_filetees', 'vis', 'ecrous', 'inserts', 'rivets',
    'forets', 'fraises', 'tarauds', 'abrasifs', 'soudure'
  )),
  add constraint reception_stock_operations_unite_stock_check check (unite_stock is null or unite_stock in ('pieces', 'mm', 'unites'));

alter table public.reception_stock_mouvements
  drop constraint if exists reception_stock_mouvements_unite_check;
alter table public.reception_stock_mouvements
  add constraint reception_stock_mouvements_unite_check check (unite in ('pieces', 'mm', 'unites'));

-- Une identité Catalogue est créée seulement si elle manque réellement. Cette
-- partie est sans effet sur les références déjà reliées par les migrations précédentes.
insert into public.references_metier (code, source_catalogue_id, statut)
select 'CAT-' || catalogue.id, catalogue.id, 'catalogue_seul'
from public.catalogue catalogue
where catalogue.reference_metier_id is null
on conflict (code) do nothing;

update public.catalogue catalogue
set reference_metier_id = reference_metier.id
from public.references_metier reference_metier
where reference_metier.source_catalogue_id = catalogue.id
  and catalogue.reference_metier_id is null;

-- Import idempotent de 52 Abrasifs et 51 postes de soudure. Les valeurs
-- importées sont les snapshots originaux du Catalogue ; la seule normalisation
-- métier est le regroupement de POSTE SOUDURE / Poste soudure en « soudure ».
with cibles as (
  select
    catalogue.id as catalogue_id,
    catalogue.reference_metier_id,
    case when upper(btrim(catalogue.categorie)) = 'ABRASIF' then 'abrasifs' else 'soudure' end as stock_type,
    catalogue.categorie,
    catalogue.famille,
    catalogue.produit,
    catalogue.grain,
    catalogue.dimension,
    catalogue.photo,
    catalogue.description
  from public.catalogue catalogue
  where upper(btrim(catalogue.categorie)) = 'ABRASIF'
     or lower(btrim(catalogue.categorie)) = 'poste soudure'
)
insert into public.stock_articles_catalogue (
  catalogue_id, reference_metier_id, stock_type,
  categorie_catalogue_snapshot, famille_catalogue_snapshot, designation_snapshot,
  caracteristique_snapshot, dimension_snapshot, photo_snapshot, description_snapshot
)
select
  catalogue_id, reference_metier_id, stock_type,
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

-- L'initialisation devient la première et unique écriture de quantité pour
-- une référence importée. Elle rend la liaison Catalogue/Stock active dans la
-- même transaction, sans jamais se baser sur une désignation.
create or replace function public.initialiser_stock_article_catalogue(
  p_article_id bigint,
  p_unite_libelle text,
  p_conditionnement_label text,
  p_quantite_disponible numeric,
  p_seuil_minimum numeric,
  p_facteur_conversion numeric default 1
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_article public.stock_articles_catalogue%rowtype;
  v_unite text;
  v_conditionnement text;
begin
  if p_article_id is null or p_quantite_disponible is null or p_quantite_disponible < 0
     or p_seuil_minimum is null or p_seuil_minimum < 0
     or p_facteur_conversion is null or p_facteur_conversion <= 0 then
    raise exception 'Les paramètres d''initialisation sont invalides.' using errcode = 'P0001';
  end if;
  v_unite := nullif(btrim(p_unite_libelle), '');
  v_conditionnement := nullif(btrim(p_conditionnement_label), '');
  if v_unite is null then
    raise exception 'Un libellé d''unité est requis.' using errcode = 'P0001';
  end if;

  select * into v_article
  from public.stock_articles_catalogue
  where id = p_article_id
  for update;
  if not found then
    raise exception 'Référence Stock introuvable.' using errcode = 'P0002';
  end if;

  if v_article.etat_initialisation = 'initialise' then
    return jsonb_build_object('status', 'already_initialised', 'articleId', v_article.id);
  end if;

  update public.stock_articles_catalogue
  set etat_initialisation = 'initialise',
      unite_technique = 'unites',
      unite_libelle = v_unite,
      conditionnement_label = v_conditionnement,
      unite_commande = 'unite',
      facteur_conversion = p_facteur_conversion,
      quantite_disponible = p_quantite_disponible,
      seuil_minimum = p_seuil_minimum,
      updated_at = now()
  where id = v_article.id;

  update public.references_metier
  set stock_type = v_article.stock_type,
      stock_reference_id = v_article.id,
      stock_reference_key = null,
      statut = 'commun',
      updated_at = now()
  where id = v_article.reference_metier_id;

  insert into public.catalogue_stock_liaisons (
    catalogue_id, reference_metier_id, stock_type, stock_reference_id,
    stock_reference_key, unite_commande, unite_stock, facteur_conversion,
    configuration, libelle_cible, actif
  ) values (
    v_article.catalogue_id, v_article.reference_metier_id, v_article.stock_type,
    v_article.id, null, 'unite', 'unites', p_facteur_conversion,
    jsonb_build_object('source', 'stock_articles_catalogue', 'conditionnement_label', v_conditionnement, 'unite_libelle', v_unite),
    v_article.designation_snapshot, true
  )
  on conflict (catalogue_id) do update
  set reference_metier_id = excluded.reference_metier_id,
      stock_type = excluded.stock_type,
      stock_reference_id = excluded.stock_reference_id,
      stock_reference_key = null,
      unite_commande = excluded.unite_commande,
      unite_stock = excluded.unite_stock,
      facteur_conversion = excluded.facteur_conversion,
      configuration = excluded.configuration,
      libelle_cible = excluded.libelle_cible,
      actif = true,
      updated_at = now();

  return jsonb_build_object('status', 'initialised', 'articleId', v_article.id);
end;
$$;

-- Les références génériques utilisent une fonction atomique dédiée afin de ne
-- pas modifier les branches physiques historiques (tubes, tiges, fixations,
-- outillage) de la fonction déjà en production.
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
  v_reception_id uuid;
  v_commande_id uuid;
  v_before numeric;
  v_after numeric;
  v_added numeric;
  v_before_json jsonb;
  v_after_json jsonb;
begin
  select * into v_operation from public.reception_stock_operations where id = p_operation_id for update;
  if not found then raise exception 'Opération de réception introuvable.' using errcode = 'P0002'; end if;
  if v_operation.statut = 'appliquee' then return jsonb_build_object('status', 'already_applied', 'operationId', v_operation.id); end if;
  if v_operation.statut <> 'prete_a_confirmer' or v_operation.stock_type not in ('abrasifs', 'soudure') then
    raise exception 'Cette opération générique ne peut pas être confirmée.' using errcode = 'P0001';
  end if;
  if p_application_idempotency_key is null or v_operation.stock_reference_id is null or v_operation.quantite_a_ajouter is null then
    raise exception 'La confirmation nécessite une référence, une quantité et une clé d''idempotence.' using errcode = 'P0001';
  end if;
  select ligne.reception_id, reception.commande_id into v_reception_id, v_commande_id
  from public.commande_reception_lignes ligne join public.commande_receptions reception on reception.id = ligne.reception_id
  where ligne.id = v_operation.commande_reception_ligne_id;
  if not found then raise exception 'Réception source introuvable.' using errcode = 'P0002'; end if;
  select * into v_article from public.stock_articles_catalogue where id = v_operation.stock_reference_id for update;
  if not found or v_article.etat_initialisation <> 'initialise' or v_article.quantite_disponible is null then
    raise exception 'La référence Stock n''est plus initialisée.' using errcode = 'P0001';
  end if;
  if v_article.stock_type <> v_operation.stock_type then raise exception 'La référence Stock ne correspond pas à l''opération.' using errcode = 'P0001'; end if;
  v_before := v_article.quantite_disponible;
  v_added := v_operation.quantite_a_ajouter;
  v_after := v_before + v_added;
  v_before_json := jsonb_build_object('unites', v_before);
  v_after_json := jsonb_build_object('unites', v_after);
  update public.stock_articles_catalogue set quantite_disponible = v_after, updated_at = now() where id = v_article.id;
  update public.reception_stock_operations
  set statut = 'appliquee', stock_avant = v_before_json, stock_apres = v_after_json,
      application_idempotency_key = p_application_idempotency_key, appliquee_le = now(),
      appliquee_par = nullif(btrim(p_appliquee_par), ''), erreur = null, updated_at = now()
  where id = v_operation.id;
  insert into public.reception_stock_mouvements(operation_id, commande_id, reception_id, commande_reception_ligne_id, catalogue_stock_liaison_id, stock_type, stock_reference_id, stock_reference_key, quantite_ajoutee, unite, stock_avant, stock_apres, details, valide_par)
  values (v_operation.id, v_commande_id, v_reception_id, v_operation.commande_reception_ligne_id, v_operation.catalogue_stock_liaison_id, v_operation.stock_type, v_operation.stock_reference_id, null, v_added, 'unites', v_before_json, v_after_json, jsonb_build_object('quantite_recue', v_operation.quantite_recue, 'unite_commande', v_operation.unite_commande, 'configuration', coalesce(v_operation.details_reception->'configuration', '{}'::jsonb)), nullif(btrim(p_appliquee_par), ''));
  return jsonb_build_object('status', 'applied', 'operationId', v_operation.id, 'stockAvant', v_before_json, 'stockApres', v_after_json, 'quantiteAjoutee', v_added, 'unite', 'unites');
end;
$$;

alter table public.stock_articles_catalogue enable row level security;
revoke all on table public.stock_articles_catalogue from anon, authenticated;
grant all on table public.stock_articles_catalogue to service_role;
revoke all on function public.initialiser_stock_article_catalogue(bigint, text, text, numeric, numeric, numeric) from public, anon, authenticated;
grant execute on function public.initialiser_stock_article_catalogue(bigint, text, text, numeric, numeric, numeric) to service_role;
revoke all on function public.appliquer_reception_stock_article_catalogue_operation(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.appliquer_reception_stock_article_catalogue_operation(uuid, text, uuid) to service_role;

commit;
