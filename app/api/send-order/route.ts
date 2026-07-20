import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { demandeur, commentaire, articles } = await req.json();

    const listeArticles = articles
      .map(
        (article: any) =>
          `<li>${article.article} - Quantité : ${article.quantite}</li>`
      )
      .join("");

      const { data, error } = await resend.emails.send({
        from: "Commande Atelier <onboarding@resend.dev>",
        to: ["bermon.carla.dl@gmail.com"],
        subject: `Nouvelle Commande Atelier`,
        html: `
          ...
        `,
      });
      
      console.log("DATA :", data);
      console.log("ERROR :", error);
      
      if (error) {
        return Response.json({ error }, { status: 500 });
      }

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false }, { status: 500 });
  }
}