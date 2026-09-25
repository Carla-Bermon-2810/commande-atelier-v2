import { getCommandesSuivi } from "@/lib/commande-receptions-server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const commandes = await getCommandesSuivi();
    return Response.json({ commandes });
  } catch (error) {
    console.error("Erreur lecture liste commandes :", error);
    return Response.json({ message: "Impossible de charger les commandes." }, { status: 500 });
  }
}
