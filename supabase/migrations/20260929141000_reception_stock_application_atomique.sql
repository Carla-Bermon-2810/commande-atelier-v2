-- Application atomique d'une réception confirmée vers le Stock.
-- Cette fonction n'est exécutable que par le serveur avec la Secret API Key.

create or replace function public.appliquer_reception_stock_operation(
  p_operation_id uuid,
  p_longueurs_mm jsonb default '[]'::jsonb,
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
  v_reception_id uuid;
  v_commande_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_added numeric;
  v_pack integer;
  v_before_pieces numeric;
  v_after_pieces numeric;
  v_length numeric;
  v_total_length numeric := 0;
  v_piece_id bigint;
  v_index integer;
  v_config jsonb;
  v_numero text;
begin
  select operation.*
    into v_operation
  from public.reception_stock_operations operation
  where operation.id = p_operation_id
  for update;

  if not found then
    raise exception 'Opération de réception introuvable.' using errcode = 'P0002';
  end if;

  select ligne.reception_id, reception.commande_id
    into v_reception_id, v_commande_id
  from public.commande_reception_lignes ligne
  join public.commande_receptions reception on reception.id = ligne.reception_id
  where ligne.id = v_operation.commande_reception_ligne_id;

  if not found then
    raise exception 'Réception source introuvable.' using errcode = 'P0002';
  end if;

  if v_operation.statut = 'appliquee' then
    return jsonb_build_object('status', 'already_applied', 'operationId', v_operation.id);
  end if;

  if v_operation.statut <> 'prete_a_confirmer' then
    raise exception 'Cette entrée Stock ne peut pas être confirmée dans son état actuel.' using errcode = 'P0001';
  end if;

  if p_application_idempotency_key is null then
    raise exception 'La confirmation nécessite une clé d''idempotence.' using errcode = 'P0001';
  end if;

  v_config := coalesce(v_operation.details_reception->'configuration', '{}'::jsonb);

  if v_operation.stock_type in ('vis', 'ecrous', 'rivets') then
    if v_operation.stock_reference_id is null or v_operation.quantite_a_ajouter is null then
      raise exception 'Référence Stock ou conversion manquante.' using errcode = 'P0001';
    end if;

    if v_operation.stock_type = 'vis' then
      select coalesce(boites_pleines, 0), coalesce(pieces_restantes, 0), coalesce(pieces_par_boite, 0)
        into v_before_pieces, v_length, v_pack
      from public.stock_vis where id = v_operation.stock_reference_id for update;
    elsif v_operation.stock_type = 'ecrous' then
      select coalesce(boites_pleines, 0), coalesce(pieces_restantes, 0), coalesce(pieces_par_boite, 0)
        into v_before_pieces, v_length, v_pack
      from public.stock_ecrous where id = v_operation.stock_reference_id for update;
    else
      select coalesce(boites_pleines, 0), coalesce(pieces_restantes, 0), coalesce(pieces_par_boite, 0)
        into v_before_pieces, v_length, v_pack
      from public.stock_rivets where id = v_operation.stock_reference_id for update;
    end if;

    if not found or v_pack <= 0 then
      raise exception 'La référence Stock n''existe plus ou son conditionnement est invalide.' using errcode = 'P0001';
    end if;

    v_before_pieces := v_before_pieces * v_pack + v_length;
    v_added := v_operation.quantite_a_ajouter;
    v_after_pieces := v_before_pieces + v_added;
    v_before := jsonb_build_object('pieces', v_before_pieces, 'boites_pleines', floor(v_before_pieces / v_pack), 'pieces_restantes', mod(v_before_pieces::integer, v_pack));
    v_after := jsonb_build_object('pieces', v_after_pieces, 'boites_pleines', floor(v_after_pieces / v_pack), 'pieces_restantes', mod(v_after_pieces::integer, v_pack));

    if v_operation.stock_type = 'vis' then
      update public.stock_vis set boites_pleines = floor(v_after_pieces / v_pack), pieces_restantes = mod(v_after_pieces::integer, v_pack) where id = v_operation.stock_reference_id;
    elsif v_operation.stock_type = 'ecrous' then
      update public.stock_ecrous set boites_pleines = floor(v_after_pieces / v_pack), pieces_restantes = mod(v_after_pieces::integer, v_pack) where id = v_operation.stock_reference_id;
    else
      update public.stock_rivets set boites_pleines = floor(v_after_pieces / v_pack), pieces_restantes = mod(v_after_pieces::integer, v_pack) where id = v_operation.stock_reference_id;
    end if;

  elsif v_operation.stock_type in ('inserts', 'forets', 'fraises', 'tarauds') then
    if v_operation.stock_reference_id is null or v_operation.quantite_a_ajouter is null then
      raise exception 'Référence Stock ou conversion manquante.' using errcode = 'P0001';
    end if;

    if v_operation.stock_type = 'inserts' then
      select coalesce(quantite, 0) into v_before_pieces from public.stock_inserts where id = v_operation.stock_reference_id for update;
    elsif v_operation.stock_type = 'forets' then
      select coalesce(quantite, 0) into v_before_pieces from public.stock_forets where id = v_operation.stock_reference_id for update;
    elsif v_operation.stock_type = 'fraises' then
      select coalesce(quantite, 0) into v_before_pieces from public.stock_fraises where id = v_operation.stock_reference_id for update;
    else
      select coalesce(quantite, 0) into v_before_pieces from public.stock_tarauds where id = v_operation.stock_reference_id for update;
    end if;

    if not found then
      raise exception 'La référence Stock n''existe plus.' using errcode = 'P0001';
    end if;

    v_added := v_operation.quantite_a_ajouter;
    v_after_pieces := v_before_pieces + v_added;
    v_before := jsonb_build_object('pieces', v_before_pieces);
    v_after := jsonb_build_object('pieces', v_after_pieces);

    if v_operation.stock_type = 'inserts' then
      update public.stock_inserts set quantite = v_after_pieces where id = v_operation.stock_reference_id;
    elsif v_operation.stock_type = 'forets' then
      update public.stock_forets set quantite = v_after_pieces where id = v_operation.stock_reference_id;
    elsif v_operation.stock_type = 'fraises' then
      update public.stock_fraises set quantite = v_after_pieces where id = v_operation.stock_reference_id;
    else
      update public.stock_tarauds set quantite = v_after_pieces where id = v_operation.stock_reference_id;
    end if;

  elsif v_operation.stock_type in ('tubes', 'tiges_filetees') then
    if jsonb_typeof(p_longueurs_mm) <> 'array' or jsonb_array_length(p_longueurs_mm) <> v_operation.quantite_recue then
      raise exception 'Renseignez une longueur valide pour chaque morceau reçu.' using errcode = 'P0001';
    end if;
    if not (v_config ? 'matiere') or (v_operation.stock_type = 'tubes' and (not (v_config ? 'type') or not (v_config ? 'section'))) or (v_operation.stock_type = 'tiges_filetees' and not (v_config ? 'diametre')) then
      raise exception 'Les caractéristiques techniques de cette référence ne permettent pas de créer les morceaux reçus.' using errcode = 'P0001';
    end if;

    select coalesce(sum(longueur_disponible), 0) into v_before_pieces
    from (
      select longueur_disponible from public.stock_tubes
      where v_operation.stock_type = 'tubes'
        and lower(regexp_replace(btrim(matiere), '\\s+', ' ', 'g')) = lower(v_config->>'matiere')
        and lower(regexp_replace(btrim(type), '\\s+', ' ', 'g')) = lower(v_config->>'type')
        and lower(regexp_replace(btrim(section), '\\s+', ' ', 'g')) = lower(v_config->>'section')
        and coalesce(epaisseur::text, '') = coalesce(v_config->>'epaisseur', '')
        and coalesce(lower(regexp_replace(btrim(nuance), '\\s+', ' ', 'g')), '') = coalesce(lower(v_config->>'nuance'), '')
        and statut = 'disponible'
      union all
      select longueur_disponible from public.stock_tiges_filetees
      where v_operation.stock_type = 'tiges_filetees'
        and lower(regexp_replace(btrim(matiere), '\\s+', ' ', 'g')) = lower(v_config->>'matiere')
        and lower(regexp_replace(btrim(diametre), '\\s+', ' ', 'g')) = lower(v_config->>'diametre')
        and statut = 'disponible'
    ) as morceaux;

    for v_index in 0..jsonb_array_length(p_longueurs_mm) - 1 loop
      v_length := (p_longueurs_mm->>v_index)::numeric;
      if v_length is null or v_length <= 0 or v_length > 1000000 then
        raise exception 'Chaque longueur reçue doit être comprise entre 1 et 1 000 000 mm.' using errcode = 'P0001';
      end if;
      v_total_length := v_total_length + v_length;

      if v_operation.stock_type = 'tubes' then
        v_numero := format('T-REC-%s-%s', replace(v_operation.id::text, '-', ''), v_index + 1);
        insert into public.stock_tubes(numero, parent_id, type, matiere, nuance, section, epaisseur, longueur_commandee, longueur_disponible, statut)
        values (v_numero, null, v_config->>'type', v_config->>'matiere', nullif(v_config->>'nuance', ''), v_config->>'section', nullif(v_config->>'epaisseur', '')::numeric, v_length, v_length, 'disponible')
        returning id into v_piece_id;
        insert into public.stock_mouvements(tube_id, type_mouvement, longueur, tube_source_id, tube_resultat_id, commentaire)
        values (v_piece_id, 'reception', v_length, null, v_piece_id, format('Réception commande %s · opération %s', v_commande_id, v_operation.id));
      else
        v_numero := format('TF-REC-%s-%s', replace(v_operation.id::text, '-', ''), v_index + 1);
        insert into public.stock_tiges_filetees(numero, parent_id, matiere, diametre, longueur_commandee, longueur_disponible, statut)
        values (v_numero, null, v_config->>'matiere', v_config->>'diametre', v_length, v_length, 'disponible')
        returning id into v_piece_id;
        insert into public.stock_mouvements_tiges(tige_id, type_mouvement, longueur, tige_source_id, tige_resultat_id, commentaire)
        values (v_piece_id, 'reception', v_length, null, v_piece_id, format('Réception commande %s · opération %s', v_commande_id, v_operation.id));
      end if;
    end loop;

    v_added := v_total_length;
    v_before := jsonb_build_object('longueur_totale_mm', v_before_pieces, 'morceaux_disponibles', null);
    v_after := jsonb_build_object('longueur_totale_mm', v_before_pieces + v_total_length, 'morceaux_disponibles', v_operation.quantite_recue);
  else
    raise exception 'Type de Stock non pris en charge.' using errcode = 'P0001';
  end if;

  update public.reception_stock_operations
  set statut = 'appliquee', quantite_a_ajouter = v_added, stock_avant = v_before, stock_apres = v_after,
      application_idempotency_key = p_application_idempotency_key, appliquee_le = now(), appliquee_par = nullif(btrim(p_appliquee_par), ''), erreur = null, updated_at = now()
  where id = v_operation.id;

  insert into public.reception_stock_mouvements(operation_id, commande_id, reception_id, commande_reception_ligne_id, catalogue_stock_liaison_id, stock_type, stock_reference_id, stock_reference_key, quantite_ajoutee, unite, stock_avant, stock_apres, details, valide_par)
  values (v_operation.id, v_commande_id, v_reception_id, v_operation.commande_reception_ligne_id, v_operation.catalogue_stock_liaison_id, v_operation.stock_type, v_operation.stock_reference_id, v_operation.stock_reference_key, v_added, v_operation.unite_stock, v_before, v_after, jsonb_build_object('quantite_recue', v_operation.quantite_recue, 'unite_commande', v_operation.unite_commande, 'configuration', v_config, 'longueurs_mm', case when v_operation.stock_type in ('tubes', 'tiges_filetees') then p_longueurs_mm else '[]'::jsonb end), nullif(btrim(p_appliquee_par), ''));

  return jsonb_build_object('status', 'applied', 'operationId', v_operation.id, 'stockAvant', v_before, 'stockApres', v_after, 'quantiteAjoutee', v_added, 'unite', v_operation.unite_stock);
end;
$$;

revoke all on function public.appliquer_reception_stock_operation(uuid, jsonb, text, uuid) from public, anon, authenticated;
grant execute on function public.appliquer_reception_stock_operation(uuid, jsonb, text, uuid) to service_role;

comment on function public.appliquer_reception_stock_operation(uuid, jsonb, text, uuid) is
  'Applique une seule opération de réception au Stock dans une transaction PostgreSQL, avec verrouillage et idempotence.';
