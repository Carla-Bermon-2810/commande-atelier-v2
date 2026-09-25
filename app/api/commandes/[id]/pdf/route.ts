import { createOrderPdf } from "@/lib/order-pdf";
import { getCommandeSuivi } from "@/lib/commande-receptions-server";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!UUID_PATTERN.test(id)) return Response.json({ message: "Commande introuvable." }, { status: 404 });

    const commande = await getCommandeSuivi(id);
    if (!commande) return Response.json({ message: "Commande introuvable." }, { status: 404 });

    const pdf = await createOrderPdf({
      numero: commande.numero,
      demandeur: commande.demandeur,
      commentaire: commande.commentaire ?? "",
      createdAt: new Date(commande.dateCommande),
      articles: commande.lignes.map((ligne) => ({
        article: ligne.variante && !ligne.article.includes(ligne.variante)
          ? `${ligne.article} — ${ligne.variante}`
          : ligne.article,
        famille: ligne.famille ?? "",
        quantite: ligne.quantiteCommandee,
      })),
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="bon-de-commande-${commande.numero}.pdf"`,
        "Cache-Control": "private, max-age=0, no-store",
      },
    });
  } catch (error) {
    console.error("Erreur génération PDF commande :", error);
    return Response.json({ message: "Impossible de générer le PDF." }, { status: 500 });
  }
}
