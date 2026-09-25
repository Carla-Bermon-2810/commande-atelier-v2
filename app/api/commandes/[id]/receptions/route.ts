import { randomUUID } from "crypto";
import { enregistrerReception, getCommandeSuivi } from "@/lib/commande-receptions-server";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function optionalText(value: unknown, maximum: number) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length <= maximum ? text : null;
}

function parseReception(payload: unknown, commandeId: string) {
  if (!payload || typeof payload !== "object") return null;

  const input = payload as Record<string, unknown>;
  if (!Array.isArray(input.lignes) || input.lignes.length === 0 || input.lignes.length > 100) return null;

  const lignes = input.lignes.map((ligne) => {
    if (!ligne || typeof ligne !== "object") return null;
    const inputLigne = ligne as Record<string, unknown>;
    const commandeArticleId = inputLigne.commandeArticleId;
    const quantiteRecue = Number(inputLigne.quantiteRecue);

    if (!isUuid(commandeArticleId) || !Number.isInteger(quantiteRecue) || quantiteRecue < 1 || quantiteRecue > 10_000) {
      return null;
    }

    return { commandeArticleId, quantiteRecue };
  });

  const commentaire = optionalText(input.commentaire, 1_000);
  const enregistrePar = optionalText(input.enregistrePar, 100);
  const idempotencyKey = input.idempotencyKey === undefined ? randomUUID() : input.idempotencyKey;

  if (
    lignes.some((ligne) => ligne === null) ||
    !isUuid(idempotencyKey) ||
    commentaire === null ||
    enregistrePar === null
  ) {
    return null;
  }

  const ids = lignes.map((ligne) => ligne!.commandeArticleId);
  if (new Set(ids).size !== ids.length) return null;

  return {
    commandeId,
    lignes: lignes as Array<{ commandeArticleId: string; quantiteRecue: number }>,
    commentaire,
    enregistrePar,
    idempotencyKey,
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    if (!isUuid(id)) {
      return Response.json({ message: "Commande introuvable." }, { status: 404 });
    }

    const commande = await getCommandeSuivi(id);
    if (!commande) {
      return Response.json({ message: "Commande introuvable." }, { status: 404 });
    }

    return Response.json({ commande });
  } catch (error) {
    console.error("Erreur lecture suivi commande :", error);
    return Response.json({ message: "Impossible de charger le suivi de cette commande." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    if (!isUuid(id)) {
      return Response.json({ message: "Commande introuvable." }, { status: 404 });
    }

    const reception = parseReception(await request.json(), id);
    if (!reception) {
      return Response.json({ message: "Les quantités reçues sont invalides." }, { status: 400 });
    }

    const receptionId = await enregistrerReception(reception);
    const commande = await getCommandeSuivi(id);

    return Response.json({ success: true, receptionId, commande }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("Erreur enregistrement réception :", error);

    if (message.includes("dépasse la quantité commandée")) {
      return Response.json({ message: "La quantité saisie dépasse le reliquat de cette commande." }, { status: 409 });
    }

    if (message.includes("introuvable ou annulée")) {
      return Response.json({ message: "Cette commande est introuvable ou annulée." }, { status:409 });
    }

    return Response.json({ message: "La réception n’a pas pu être enregistrée. Réessayez." }, { status: 500 });
  }
}
