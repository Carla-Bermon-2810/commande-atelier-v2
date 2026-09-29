import { randomUUID } from "crypto";

import { getCommandeSuivi } from "@/lib/commande-receptions-server";
import { appliquerOperationStock } from "@/lib/reception-stock-server";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type RouteContext = { params: Promise<{ id: string }> };

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    if (!isUuid(id)) return Response.json({ message: "Commande introuvable." }, { status: 404 });
    const payload = await request.json() as Record<string, unknown>;
    const operationId = payload.operationId;
    const rawLengths = Array.isArray(payload.longueursMm) ? payload.longueursMm : [];
    const longueursMm = rawLengths.map(Number);
    const appliqueePar = typeof payload.appliqueePar === "string" ? payload.appliqueePar.trim().slice(0, 100) : undefined;
    const idempotencyKey = payload.idempotencyKey === undefined ? randomUUID() : payload.idempotencyKey;

    if (!isUuid(operationId) || !isUuid(idempotencyKey) || longueursMm.length > 10_000 || longueursMm.some((value) => !Number.isFinite(value) || value <= 0 || value > 1_000_000)) {
      return Response.json({ message: "Les informations de confirmation sont invalides." }, { status: 400 });
    }

    const result = await appliquerOperationStock({ commandeId: id, operationId, longueursMm, appliqueePar, idempotencyKey });
    const commande = await getCommandeSuivi(id);
    return Response.json({ success: true, result, commande });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("Erreur application réception au Stock :", error);
    const status = message.includes("ne correspond pas")
      ? 404
      : message.includes("longueur") || message.includes("Référence Stock") || message.includes("n'existe plus") || message.includes("ne peut pas être confirmée") || message.includes("idempotence")
        ? 409
        : 500;
    return Response.json({ message: message || "L’entrée en Stock n’a pas pu être confirmée. Réessayez." }, { status });
  }
}
