import { Resend } from "resend";
import { createOrderPdf } from "@/lib/order-pdf";
import { getServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

type OrderArticle = {
  article: string;
  famille: string;
  catalogueId?: number;
  variante?: string;
  photo?: string;
  quantite: number;
};

type OrderPayload = {
  demandeur: string;
  commentaire: string;
  articles: OrderArticle[];
};

function getText(value: unknown, maximum: number) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 && text.length <= maximum ? text : null;
}

function parseOrder(payload: unknown): OrderPayload | null {
  if (!payload || typeof payload !== "object") return null;

  const input = payload as Record<string, unknown>;
  const demandeur = getText(input.demandeur, 100);
  const commentaire = typeof input.commentaire === "string"
    ? input.commentaire.trim().slice(0, 1_000)
    : "";

  if (!demandeur || !Array.isArray(input.articles) || input.articles.length === 0 || input.articles.length > 100) {
    return null;
  }

  const articles = input.articles.map((item): OrderArticle | null => {
    if (!item || typeof item !== "object") return null;

    const article = item as Record<string, unknown>;
    const nom = getText(article.article, 160);
    const famille = typeof article.famille === "string"
      ? article.famille.trim().slice(0, 100)
      : "";
    const catalogueId = Number(article.catalogueId);
    const variante = typeof article.variante === "string"
      ? article.variante.trim().slice(0, 160)
      : undefined;
    const photo = typeof article.photo === "string"
      ? article.photo.trim().slice(0, 2_000)
      : undefined;
    const quantite = Number(article.quantite);

    if (
      !nom ||
      !Number.isInteger(quantite) || quantite < 1 || quantite > 10_000 ||
      (article.catalogueId !== undefined && (!Number.isSafeInteger(catalogueId) || catalogueId < 1))
    ) {
      return null;
    }

    return {
      article: nom,
      famille,
      catalogueId: article.catalogueId === undefined ? undefined : catalogueId,
      variante,
      photo,
      quantite,
    };
  });

  return articles.every((article): article is OrderArticle => article !== null)
    ? { demandeur, commentaire, articles }
    : null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

export async function POST(req: Request) {
  try {
    const supabase = getServerSupabase();
    const payload = parseOrder(await req.json());

    if (!payload) {
      return Response.json(
        { success: false, message: "Commande invalide ou incomplète." },
        { status: 400 }
      );
    }

    const createdAt = new Date();
    const numero = `CMD-${createdAt.getTime()}`;
    const apiKey = process.env.RESEND_API_KEY;
    const recipient = process.env.ORDER_RECIPIENT;
    const sender = process.env.ORDER_SENDER;
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && (!apiKey || !recipient || !sender)) {
      console.error("Configuration e-mail de production incomplète.");
      return Response.json(
        { success: false, message: "Le service d'envoi des commandes n'est pas encore configuré." },
        { status: 503 }
      );
    }

    const totalQuantite = payload.articles.reduce((total, article) => total + article.quantite, 0);
    const pdf = apiKey
      ? await createOrderPdf({ ...payload, numero, createdAt })
      : null;

    const { data: commande, error: errorCommande } = await supabase
      .from("commandes")
      .insert({ numero, demandeur: payload.demandeur, commentaire: payload.commentaire })
      .select()
      .single();

    if (errorCommande) {
      console.error("Erreur commande :", errorCommande);
      return Response.json({ success: false, message: "Impossible d'enregistrer la commande." }, { status: 500 });
    }

    const { error: errorLignes } = await supabase.from("commande_articles").insert(
      payload.articles.map((article) => ({
        commande_id: commande.id,
        article: article.article,
        famille: article.famille,
        catalogue_id: article.catalogueId ?? null,
        designation_snapshot: article.article,
        variante_snapshot: article.variante ?? null,
        photo_snapshot: article.photo ?? null,
        quantite: article.quantite,
      }))
    );

    if (errorLignes) {
      console.error("Erreur lignes de commande :", errorLignes);
      await supabase.from("commandes").delete().eq("id", commande.id);
      return Response.json({ success: false, message: "Impossible d'enregistrer les articles de la commande." }, { status: 500 });
    }

    let notificationSent = false;

    if (apiKey && pdf) {
      const resend = new Resend(apiKey);
      const { error: emailError } = await resend.emails.send({
        from: sender ?? "Commande Atelier <onboarding@resend.dev>",
        to: [recipient ?? "bermon.carla.dl@gmail.com"],
        subject: `Nouvelle commande Atelier - ${numero}`,
        html: `<!doctype html><html lang="fr"><body style="margin:0;padding:28px;background:#f5f7f8;font-family:Arial,sans-serif;color:#27313a;"><table width="640" align="center" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fff;border:1px solid #dee4e8;border-radius:12px;overflow:hidden;"><tr><td style="height:4px;background:#f95516;"></td></tr><tr><td style="padding:30px 32px;"><p style="margin:0 0 8px;color:#f95516;font-size:12px;font-weight:bold;letter-spacing:1px;">DÉCOUPE LASER</p><h1 style="margin:0 0 20px;font-size:23px;line-height:1.25;">Nouvelle commande atelier</h1><p style="margin:0 0 16px;font-size:15px;line-height:1.55;">Une nouvelle commande a été enregistrée.</p><table cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.7;"><tr><td style="padding-right:22px;color:#65717c;">N° commande</td><td><strong>${numero}</strong></td></tr><tr><td style="padding-right:22px;color:#65717c;">Demandeur</td><td><strong>${escapeHtml(payload.demandeur)}</strong></td></tr><tr><td style="padding-right:22px;color:#65717c;">Date</td><td>${escapeHtml(createdAt.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }))}</td></tr><tr><td style="padding-right:22px;color:#65717c;">Commande</td><td>${payload.articles.length} ligne(s) - ${totalQuantite} unité(s)</td></tr></table><p style="margin:24px 0 0;padding-top:18px;border-top:1px solid #dee4e8;font-size:14px;line-height:1.5;">Le détail complet est disponible dans le bon de commande PDF joint.</p></td></tr></table></body></html>`,
        text: `Nouvelle commande atelier\n\nN° commande : ${numero}\nDemandeur : ${payload.demandeur}\nDate : ${createdAt.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" })}\n${payload.articles.length} ligne(s) - ${totalQuantite} unité(s)\n\nLe détail complet est disponible dans le bon de commande PDF joint.`,
        attachments: [{
          filename: `bon-de-commande-${numero}.pdf`,
          content: pdf,
          contentType: "application/pdf",
        }],
      });

      if (emailError) {
        console.error("Erreur envoi email :", emailError);
      } else {
        notificationSent = true;
      }
    } else {
      console.error("RESEND_API_KEY est absente : l'email de notification n'a pas été envoyé.");
    }

    return Response.json({ success: true, numero, commandeId: commande.id, notificationSent }, { status: 201 });
  } catch (error) {
    console.error("Erreur API commande :", error);
    return Response.json({ success: false, message: "Erreur serveur lors de l'envoi de la commande." }, { status: 500 });
  }
}
