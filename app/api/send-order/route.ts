import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { demandeur, commentaire, articles } = await req.json();

    const totalArticles = articles.length;

    const totalQuantite = articles.reduce(
      (total: number, article: any) => total + Number(article.quantite),
      0
    );

    const html = `
<!DOCTYPE html>
<html lang="fr">

<head>
<meta charset="UTF-8">
<title>Commande Atelier</title>
</head>

<body style="margin:0;padding:40px;background:#f3f5f7;font-family:Arial,Helvetica,sans-serif;">

<table width="700" align="center" cellpadding="0" cellspacing="0"
style="background:#fff;border-radius:12px;border:1px solid #ddd;overflow:hidden;">

<tr>
<td style="background:#004B87;padding:30px;text-align:center;color:white;">

<h1 style="margin:0;">
📦 Nouvelle commande Atelier
</h1>

<p style="margin-top:10px;">
Une nouvelle demande de consommables a été envoyée.
</p>

</td>
</tr>

<tr>
<td style="padding:30px;">

<table width="100%">

<tr>

<td>

<h3 style="margin-bottom:5px;color:#004B87;">
👤 Demandeur
</h3>

${demandeur}

</td>

<td align="right">

<h3 style="margin-bottom:5px;color:#004B87;">
📅 Date
</h3>

${new Date().toLocaleString("fr-FR")}

</td>

</tr>

</table>

<hr style="margin:30px 0;">

<h2 style="color:#004B87;">
Articles commandés
</h2>

<table width="100%" cellpadding="12" cellspacing="0" style="border-collapse:collapse;">

<thead>

<tr style="background:#004B87;color:white;">

<th align="left">Article</th>

<th align="left">Famille</th>

<th align="center">Qté</th>

</tr>

</thead>

<tbody>

${articles
  .map(
    (article: any) => `
<tr>

<td style="border-bottom:1px solid #eee;">
${article.article}
</td>

<td style="border-bottom:1px solid #eee;">
${article.famille || "-"}
</td>

<td align="center" style="border-bottom:1px solid #eee;font-weight:bold;">
${article.quantite}
</td>

</tr>
`
  )
  .join("")}

</tbody>

</table>

<br>

<table width="100%" style="background:#f8f8f8;border-radius:8px;padding:15px;">

<tr>

<td>

<strong>Nombre d'articles :</strong>

${totalArticles}

</td>

<td align="right">

<strong>Quantité totale :</strong>

${totalQuantite}

</td>

</tr>

</table>

<h2 style="margin-top:35px;color:#004B87;">
💬 Commentaire
</h2>

<div style="background:#f8f8f8;padding:18px;border-left:4px solid #004B87;border-radius:6px;">

${commentaire || "Aucun commentaire"}

</div>

</td>
</tr>

<tr>

<td style="background:#f3f3f3;padding:20px;text-align:center;font-size:13px;color:#666;">

<b>Commande Atelier V2</b>

<br>

Découpe Laser

<br><br>

Mail généré automatiquement.

</td>

</tr>

</table>

</body>

</html>
`;

    const { data, error } = await resend.emails.send({
      from: "Commande Atelier <onboarding@resend.dev>",
      to: ["bermon.carla.dl@gmail.com"],
      subject: "📦 Nouvelle commande Atelier",
      html,
    });

    if (error) {
      console.error(error);
      return Response.json({ error }, { status: 500 });
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    return Response.json(
      {
        success: false,
        message: "Erreur lors de l'envoi.",
      },
      {
        status: 500,
      }
    );
  }
}