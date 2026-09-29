import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/admin-auth";
import {
  getCatalogueStockLinkData,
  getStockLinkTarget,
  STOCK_LINK_SOURCES,
  type CommandUnit,
  type StockLinkSource,
} from "@/lib/catalogue-stock-links";
import { getServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const commandUnits = new Set<CommandUnit>(["piece", "boite", "tube", "tige"]);
const stockSources = new Set<string>(STOCK_LINK_SOURCES);

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isSource(value: unknown): value is StockLinkSource {
  return typeof value === "string" && stockSources.has(value);
}

export async function GET() {
  if (!await hasAdminAccess()) return NextResponse.json({ message: "Accès administrateur requis." }, { status: 401 });

  try {
    return NextResponse.json(await getCatalogueStockLinkData());
  } catch (error) {
    console.error("Erreur chargement liaisons catalogue / stock:", error);
    return NextResponse.json({ message: "Impossible de charger les liaisons Catalogue / Stock." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await hasAdminAccess()) return NextResponse.json({ message: "Accès administrateur requis." }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.action !== "string") return NextResponse.json({ message: "Demande invalide." }, { status: 400 });

  const supabase = getServerSupabase();

  try {
    if (body.action === "delete") {
      if (typeof body.linkId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.linkId)) {
        return NextResponse.json({ message: "Liaison invalide." }, { status: 400 });
      }
      const { error } = await supabase.from("catalogue_stock_liaisons").delete().eq("id", body.linkId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (body.action === "set-active") {
      if (typeof body.linkId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.linkId) || typeof body.actif !== "boolean") {
        return NextResponse.json({ message: "Liaison invalide." }, { status: 400 });
      }
      const { error } = await supabase.from("catalogue_stock_liaisons")
        .update({ actif: body.actif, updated_at: new Date().toISOString() })
        .eq("id", body.linkId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (body.action !== "save" || !isPositiveInteger(body.catalogueId) || !isSource(body.stockType) || typeof body.targetId !== "string" || !commandUnits.has(body.uniteCommande as CommandUnit)) {
      return NextResponse.json({ message: "Configuration de liaison invalide." }, { status: 400 });
    }

    const conversion = Number(body.facteurConversion);
    if (!Number.isFinite(conversion) || conversion <= 0 || conversion > 1_000_000) {
      return NextResponse.json({ message: "Le facteur de conversion doit être supérieur à zéro." }, { status: 400 });
    }

    const targetParts = body.targetId.split(":");
    if (targetParts.length < 2 || targetParts[0] !== body.stockType) {
      return NextResponse.json({ message: "Référence de stock invalide." }, { status: 400 });
    }

    const isLengthStock = body.stockType === "tubes" || body.stockType === "tiges_filetees";
    const referenceId = isLengthStock ? null : Number(targetParts.slice(1).join(":"));
    const referenceKey = isLengthStock ? targetParts.slice(1).join(":") : null;
    if ((!isLengthStock && !isPositiveInteger(referenceId)) || (isLengthStock && !referenceKey)) {
      return NextResponse.json({ message: "Référence de stock invalide." }, { status: 400 });
    }

    const target = await getStockLinkTarget(body.stockType, referenceId, referenceKey);
    if (!target) return NextResponse.json({ message: "La référence de stock sélectionnée n’existe plus." }, { status: 409 });

    const uniteCommande = body.uniteCommande as CommandUnit;
    if ((body.stockType === "tubes" && uniteCommande !== "tube") || (body.stockType === "tiges_filetees" && uniteCommande !== "tige")) {
      return NextResponse.json({ message: "Les tubes et tiges doivent conserver leur unité de commande dédiée." }, { status: 400 });
    }

    const { error } = await supabase.from("catalogue_stock_liaisons").upsert({
      catalogue_id: body.catalogueId,
      stock_type: body.stockType,
      stock_reference_id: target.referenceId,
      stock_reference_key: target.referenceKey,
      unite_commande: uniteCommande,
      unite_stock: target.uniteStock,
      facteur_conversion: conversion,
      libelle_cible: target.label,
      actif: true,
      configuration: {
        target_label: target.label,
        target_reference: target.reference,
        caracteristiques: target.caracteristiques,
      },
      updated_at: new Date().toISOString(),
    }, { onConflict: "catalogue_id" });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur mise à jour liaison catalogue / stock:", error);
    return NextResponse.json({ message: "Impossible d’enregistrer cette liaison." }, { status: 500 });
  }
}
