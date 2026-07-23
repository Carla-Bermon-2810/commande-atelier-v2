import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { demandeur, commentaire, articles } = await req.json();

    if (!demandeur || !articles || articles.length === 0) {
      return Response.json(
        {
          success: false,
          message: "Commande incomplète.",
        },
        {
          status: 400,
        }
      );
    }

    const numero = `CMD-${Date.now()}`;

    // ==========================
    // Création de la commande
    // ==========================

    const { data: commande, error: errorCommande } = await supabase
      .from("commandes")
      .insert({
        numero,
        demandeur,
        commentaire,
      })
      .select()
      .single();

    if (errorCommande) {
      console.error("Erreur commande :", errorCommande);

      return Response.json(
        {
          success: false,
          error: errorCommande.message,
        },
        {
          status: 500,
        }
      );
    }

    // ==========================
    // Création des lignes
    // ==========================

    const lignes = articles.map((article: any) => ({
      commande_id: commande.id,
      article: article.article,
      famille: article.famille ?? "",
      quantite: Number(article.quantite),
    }));

    const { error: errorLignes } = await supabase
      .from("commande_articles")
      .insert(lignes);

    if (errorLignes) {
      console.error("Erreur lignes :", errorLignes);

      return Response.json(
        {
          success: false,
          error: errorLignes.message,
        },
        {
          status: 500,
        }
      );
    }

    // ==========================
    // Calculs
    // ==========================

    const totalArticles = articles.length;

    const totalQuantite = articles.reduce(
      (total: number, article: any) =>
        total + Number(article.quantite),
      0
    );

    // ==========================
    // Email HTML
    // ==========================

    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
    <meta charset="UTF-8">
    </head>
    
    <body style="margin:0;padding:30px;background:#f4f6f8;font-family:Arial,sans-serif;">
    
    <table width="700" align="center" cellpadding="0" cellspacing="0"
    style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #dcdcdc;">
    
    <tr>
    <td style="background:#004B87;padding:30px;text-align:center;color:white;">
    
    <h1 style="margin:0;font-size:30px;">
    📦 Nouvelle commande Atelier
    </h1>
    
    <p style="margin-top:10px;font-size:16px;">
    Découpe Laser
    </p>
    
    </td>
    </tr>
    
    <tr>
    <td style="padding:30px;">
    
    <table width="100%" cellpadding="8">
    
    <tr>
    <td width="50%">
    
    <b>N° Commande</b><br>
    ${numero}
    
    </td>
    
    <td align="right">
    
    <b>Date</b><br>
    ${new Date().toLocaleString("fr-FR")}
    
    </td>
    </tr>
    
    <tr>
    <td colspan="2">
    
    <br>
    
    <b>Demandeur</b><br>
    
    ${demandeur}
    
    </td>
    </tr>
    
    </table>
    
    <br>
    
    <h2 style="color:#004B87;">
    Articles commandés
    </h2>
    
    <table width="100%" cellspacing="0" cellpadding="10" style="border-collapse:collapse;">
    
    <thead>
    
    <tr style="background:#004B87;color:white;">
    
    <th align="left">
    Article
    </th>
    
    <th align="left">
    Famille
    </th>
    
    <th align="center">
    Qté
    </th>
    
    </tr>
    
    </thead>
    
    <tbody>
    
    ${articles
      .map(
        (article: any) => `
    <tr>
    
    <td style="border-bottom:1px solid #ddd;">
    ${article.article}
    </td>
    
    <td style="border-bottom:1px solid #ddd;">
    ${article.famille || "-"}
    </td>
    
    <td align="center" style="border-bottom:1px solid #ddd;font-weight:bold;">
    ${article.quantite}
    </td>
    
    </tr>
    `
      )
      .join("")}
    
    </tbody>
    
    </table>
    
    <br>
    
    <table width="100%" style="background:#f4f4f4;padding:15px;border-radius:8px;">
    
    <tr>
    
    <td>
    
    <b>Nombre d'articles :</b>
    
    ${totalArticles}
    
    </td>
    
    <td align="right">
    
    <b>Quantité totale :</b>
    
    ${totalQuantite}
    
    </td>
    
    </tr>
    
    </table>
    
    <br>
    
    <h2 style="color:#004B87;">
    Commentaire
    </h2>
    
    <div style="background:#f4f4f4;padding:15px;border-left:5px solid #004B87;border-radius:6px;">
    
    ${commentaire || "Aucun commentaire"}
    
    </div>
    
    </td>
    </tr>
    
    <tr>
    
    <td style="background:#ececec;padding:20px;text-align:center;font-size:13px;color:#666;">
    
    Commande générée automatiquement par
    <b>Commande Atelier V2</b>
    
    </td>
    
    </tr>
    
    </table>
    
    </body>
    </html>
    `;
    
// ==========================
// Envoi de l'email
// ==========================

const { data, error } = await resend.emails.send({
  from: "Commande Atelier <onboarding@resend.dev>",
  to: ["bermon.carla.dl@gmail.com"],
  subject: `📦 Nouvelle commande Atelier - ${numero}`,
  html,
});

if (error) {
  console.error("Erreur Resend :", error);

  return Response.json(
    {
      success: false,
      error: error.message,
    },
    {
      status: 500,
    }
  );
}

return Response.json({
  success: true,
  numero,
  commandeId: commande.id,
  data,
});

} catch (err: any) {
  console.error("Erreur API :", err);

  return Response.json(
  {
    success: false,
    message: err?.message || "Erreur serveur",
  },
  {
    status: 500,
  }
);
}
}