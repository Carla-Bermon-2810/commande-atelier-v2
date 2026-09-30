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
  unite?: string;
  referenceMetier?: string;
  stockReference?: {
    source: string;
    referenceId?: number;
    referenceKey?: string;
    uniteCommande: "piece" | "boite" | "barre";
    uniteStock: "pieces" | "mm";
    facteurConversion: number;
    longueurParBarreMm?: number;
    configuration?: Record<string, string | number | null>;
  };
  quantite: number;
};

type CatalogueStockLinkRow = {
  catalogue_id: number;
  stock_type: string;
  stock_reference_id: number | null;
  stock_reference_key: string | null;
  unite_commande: "piece" | "boite" | "tube" | "tige";
  unite_stock: "pieces" | "mm";
  facteur_conversion: number | string;
  actif: boolean;
  configuration: Record<string, string | number | null> | null;
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
    const unite = typeof article.unite === "string"
      ? article.unite.trim().slice(0, 120) || undefined
      : undefined;
    const referenceMetier = typeof article.referenceMetier === "string"
      ? article.referenceMetier.trim().slice(0, 300) || undefined
      : undefined;
    const quantite = Number(article.quantite);
    const stockInput = article.stockReference;
    const stockReference = stockInput && typeof stockInput === "object"
      ? stockInput as Record<string, unknown>
      : undefined;
    const stockSource = stockReference?.source;
    const validStockSource = typeof stockSource === "string" && ["tubes", "tiges_filetees", "vis", "ecrous", "inserts", "rivets", "forets", "fraises", "tarauds"].includes(stockSource);
    const referenceId = Number(stockReference?.referenceId);
    const referenceKey = typeof stockReference?.referenceKey === "string" ? stockReference.referenceKey.trim().slice(0, 300) : undefined;
    const uniteCommande = stockReference?.uniteCommande;
    const uniteStock = stockReference?.uniteStock;
    const facteurConversion = Number(stockReference?.facteurConversion);
    const longueurParBarreMm = Number(stockReference?.longueurParBarreMm);
    const configuration = (stockReference?.configuration && typeof stockReference.configuration === "object" && !Array.isArray(stockReference.configuration)
      ? Object.fromEntries(Object.entries(stockReference.configuration as Record<string, unknown>).filter(([, value]) => value === null || typeof value === "string" || (typeof value === "number" && Number.isFinite(value))).slice(0, 12))
      : undefined) as Record<string, string | number | null> | undefined;

    if (
      !nom ||
      !Number.isInteger(quantite) || quantite < 1 || quantite > 10_000 ||
      (article.catalogueId !== undefined && (!Number.isSafeInteger(catalogueId) || catalogueId < 1))
      || (stockReference !== undefined && (!validStockSource || (!Number.isSafeInteger(referenceId) && !referenceKey) || !["piece", "boite", "barre"].includes(String(uniteCommande)) || !["pieces", "mm"].includes(String(uniteStock)) || !Number.isFinite(facteurConversion) || facteurConversion <= 0 || (stockReference.longueurParBarreMm !== undefined && (!Number.isFinite(longueurParBarreMm) || longueurParBarreMm <= 0))))
    ) {
      return null;
    }

    return {
      article: nom,
      famille,
      catalogueId: article.catalogueId === undefined ? undefined : catalogueId,
      variante,
      photo,
      unite,
      referenceMetier,
      stockReference: stockReference ? {
        source: stockSource as string,
        referenceId: Number.isSafeInteger(referenceId) ? referenceId : undefined,
        referenceKey,
        uniteCommande: uniteCommande as "piece" | "boite" | "barre",
        uniteStock: uniteStock as "pieces" | "mm",
        facteurConversion,
        longueurParBarreMm: Number.isFinite(longueurParBarreMm) ? longueurParBarreMm : undefined,
        configuration,
      } : undefined,
      quantite,
    };
  });

  return articles.every((article): article is OrderArticle => article !== null)
    ? { demandeur, commentaire, articles }
    : null;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function libelleUnite(snapshot: NonNullable<OrderArticle["stockReference"]>) {
  if (snapshot.uniteCommande === "barre") {
    return snapshot.longueurParBarreMm
      ? `Barre de ${formatNumber(snapshot.longueurParBarreMm)} mm`
      : "Longueur à confirmer à la réception";
  }
  if (snapshot.uniteCommande === "boite") {
    return `Boîte de ${formatNumber(snapshot.facteurConversion)} pièce${snapshot.facteurConversion > 1 ? "s" : ""}`;
  }
  return "Pièce";
}

function snapshotDepuisLiaison(liaison: CatalogueStockLinkRow): NonNullable<OrderArticle["stockReference"]> | null {
  const facteurConversion = Number(liaison.facteur_conversion);
  const source = liaison.stock_type;
  const isValidSource = ["tubes", "tiges_filetees", "vis", "ecrous", "inserts", "rivets", "forets", "fraises", "tarauds"].includes(source);
  if (!liaison.actif || !isValidSource || !Number.isFinite(facteurConversion) || facteurConversion <= 0) return null;
  if (!Number.isSafeInteger(liaison.stock_reference_id) && !liaison.stock_reference_key) return null;

  return {
    source,
    referenceId: Number.isSafeInteger(liaison.stock_reference_id) ? liaison.stock_reference_id ?? undefined : undefined,
    referenceKey: liaison.stock_reference_key ?? undefined,
    uniteCommande: liaison.unite_commande === "boite" ? "boite" : liaison.unite_commande === "piece" ? "piece" : "barre",
    uniteStock: liaison.unite_stock,
    facteurConversion,
    configuration: liaison.configuration ?? undefined,
  };
}

async function enrichirArticlesDepuisLiaisons(supabase: ReturnType<typeof getServerSupabase>, articles: OrderArticle[]) {
  const catalogueIds = [...new Set(articles.flatMap((article) => article.catalogueId ? [article.catalogueId] : []))];
  const nettoyerVarianteStock = (article: OrderArticle) => article.variante?.startsWith("Commande stock ·")
    ? { ...article, variante: undefined }
    : article;
  if (!catalogueIds.length) {
    return articles.map((rawArticle) => {
      const article = nettoyerVarianteStock(rawArticle);
      return article.stockReference
        ? { ...article, unite: libelleUnite(article.stockReference) }
        : article;
    });
  }

  const { data, error } = await supabase
    .from("catalogue_stock_liaisons")
    .select("catalogue_id,stock_type,stock_reference_id,stock_reference_key,unite_commande,unite_stock,facteur_conversion,actif,configuration")
    .in("catalogue_id", catalogueIds)
    .eq("actif", true)
    .returns<CatalogueStockLinkRow[]>();

  // Une indisponibilité ponctuelle du référentiel ne doit jamais empêcher une
  // commande Catalogue valide : elle sera simplement sans entrée Stock future.
  if (error) {
    console.error("Référentiel Catalogue / Stock indisponible :", error);
    return articles.map((rawArticle) => {
      const article = nettoyerVarianteStock(rawArticle);
      return article.stockReference
        ? { ...article, unite: libelleUnite(article.stockReference) }
        : article;
    });
  }

  const liaisonParCatalogue = new Map((data ?? []).map((liaison) => [liaison.catalogue_id, liaison]));
  return articles.map((rawArticle) => {
    const article = nettoyerVarianteStock(rawArticle);
    if (article.stockReference) return { ...article, unite: libelleUnite(article.stockReference) };
    const liaison = article.catalogueId ? liaisonParCatalogue.get(article.catalogueId) : undefined;
    const stockReference = liaison ? snapshotDepuisLiaison(liaison) : null;
    return stockReference
      ? { ...article, stockReference, unite: libelleUnite(stockReference), referenceMetier: stockReference.referenceKey ?? article.referenceMetier }
      : article;
  });
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

    const articles = await enrichirArticlesDepuisLiaisons(supabase, payload.articles);
    const commandePourPdf = { ...payload, articles };
    const totalQuantite = articles.reduce((total, article) => total + article.quantite, 0);
    const pdf = apiKey
      ? await createOrderPdf({ ...commandePourPdf, numero, createdAt })
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
      articles.map((article) => ({
        commande_id: commande.id,
        article: article.article,
        famille: article.famille,
        catalogue_id: article.catalogueId ?? null,
        designation_snapshot: article.article,
        variante_snapshot: article.variante ?? null,
        photo_snapshot: article.photo ?? null,
        unite_snapshot: article.unite ?? null,
        stock_reference_snapshot: article.stockReference ?? null,
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
