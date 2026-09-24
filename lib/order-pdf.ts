import PDFDocument from "pdfkit";

export type PdfOrderArticle = {
  article: string;
  famille: string;
  quantite: number;
};

type PdfOrder = {
  numero: string;
  demandeur: string;
  commentaire: string;
  articles: PdfOrderArticle[];
  createdAt?: Date;
};

const ORANGE = "#F95516";
const INK = "#27313A";
const MUTED = "#65717C";
const LINE = "#DEE4E8";
const PALE = "#F6F8F9";

function splitArticle(article: string) {
  const [name, ...variant] = article.split(" — ");
  return { name, variant: variant.join(" — ") };
}

function isOutsideCatalogue(article: PdfOrderArticle) {
  return article.famille === "Demande hors catalogue" || article.article.startsWith("Hors catalogue — ");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

function escapePdfText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/** Génère le document joint sans écrire de fichier temporaire sur le serveur. */
export async function createOrderPdf(order: PdfOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: `Bon de commande ${order.numero}`, Author: "Découpe Laser" } });
    const chunks: Buffer[] = [];
    const width = 595.28;
    const height = 841.89;
    const left = 52;
    const right = width - 52;
    const contentWidth = right - left;
    const tableBottom = height - 61;
    const standard = order.articles.filter((article) => !isOutsideCatalogue(article));
    const outsideCatalogue = order.articles.filter(isOutsideCatalogue);
    let page = 1;
    let y = 0;

    const footer = () => {
      doc.font("Helvetica").fontSize(7).fillColor(MUTED)
        .text("Commande Atelier - Découpe Laser", left, height - 35, { width: 220 });
      doc.text(`${order.numero}  |  Page ${page}`, right - 180, height - 35, { width: 180, align: "right" });
    };

    const pageHeader = (includeMetadata: boolean) => {
      doc.strokeColor(ORANGE).lineWidth(1.2).moveTo(left, 42).lineTo(right, 42).stroke();
      doc.font("Helvetica-Bold").fontSize(8).fillColor(ORANGE).text("DÉCOUPE LASER", left, 78);
      doc.font("Helvetica").fontSize(9).fillColor(INK).text("Commande interne - atelier", left, 96);
      doc.font("Helvetica-Bold").fontSize(19).fillColor(INK).text("BON DE COMMANDE ATELIER", left + 164, 78, { width: contentWidth - 164, align: "right" });
      doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text(order.numero, left + 164, 106, { width: contentWidth - 164, align: "right" });
      doc.strokeColor(LINE).lineWidth(0.5).moveTo(left, 126).lineTo(right, 126).stroke();

      if (!includeMetadata) return 153;

      const boxY = 151;
      const columns = [174, 182, contentWidth - 356];
      const labels = ["DEMANDEUR", "DATE ET HEURE", "RÉFÉRENCES"];
      const values = [
        escapePdfText(order.demandeur),
        formatDate(order.createdAt ?? new Date()),
        `${order.articles.length} ligne${order.articles.length > 1 ? "s" : ""} - ${order.articles.reduce((total, article) => total + article.quantite, 0)} unité${order.articles.reduce((total, article) => total + article.quantite, 0) > 1 ? "s" : ""}`,
      ];
      let x = left;
      columns.forEach((column, index) => {
        doc.rect(x, boxY, column, 57).fillAndStroke(PALE, LINE);
        doc.font("Helvetica-Bold").fontSize(7).fillColor(MUTED).text(labels[index], x + 10, boxY + 13, { width: column - 20 });
        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(INK).text(values[index], x + 10, boxY + 32, { width: column - 20, lineBreak: false, ellipsis: true });
        x += column;
      });
      return 235;
    };

    const addPage = (metadata = false) => {
      if (y > 0) {
        footer();
        doc.addPage();
        page += 1;
      }
      y = pageHeader(metadata);
    };

    const tableHeader = () => {
      const headerHeight = 26;
      const widths = [176, 211, 48, contentWidth - 435];
      const labels = ["PRODUIT", "CARACTÉRISTIQUE", "QTÉ", "UNITÉ"];
      doc.rect(left, y, contentWidth, headerHeight).fill(INK);
      let x = left;
      widths.forEach((column, index) => {
        doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#B7C0C8").text(labels[index], x + 8, y + 9, { width: column - 16, align: index === 2 ? "right" : "left" });
        x += column;
      });
      y += headerHeight;
      return widths;
    };

    const drawRow = (article: PdfOrderArticle, widths: number[]) => {
      const { name, variant } = splitArticle(article.article);
      const description = [article.famille === "Demande hors catalogue" ? "Hors catalogue" : article.famille, variant].filter(Boolean).join(" - ");
      doc.font("Helvetica-Bold").fontSize(8.5);
      const productHeight = doc.heightOfString(name, { width: widths[0] - 16, lineGap: 2 });
      doc.font("Helvetica").fontSize(8.4);
      const descriptionHeight = doc.heightOfString(description || "-", { width: widths[1] - 16, lineGap: 2 });
      const rowHeight = Math.max(34, productHeight + 16, descriptionHeight + 16);

      if (y + rowHeight > tableBottom) {
        addPage(false);
        widths = tableHeader();
      }

      const alternate = Math.round((y - 1) / 34) % 2 === 0;
      if (alternate) doc.rect(left, y, contentWidth, rowHeight).fill("#FBFCFC");
      doc.strokeColor(LINE).lineWidth(0.4).moveTo(left, y + rowHeight).lineTo(right, y + rowHeight).stroke();
      let x = left;
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK).text(name, x + 8, y + 8, { width: widths[0] - 16, lineGap: 2 });
      x += widths[0];
      doc.font("Helvetica").fontSize(8.4).fillColor(INK).text(description || "-", x + 8, y + 8, { width: widths[1] - 16, lineGap: 2 });
      x += widths[1];
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK).text(String(article.quantite), x + 8, y + 8, { width: widths[2] - 16, align: "right" });
      x += widths[2];
      doc.font("Helvetica").fontSize(8.4).fillColor(INK).text("unité", x + 8, y + 8, { width: widths[3] - 16 });
      y += rowHeight;
    };

    const drawNote = (label: string, text: string, emphasized = false) => {
      if (!text.trim()) return;
      doc.font("Helvetica").fontSize(9);
      const bodyHeight = doc.heightOfString(text, { width: contentWidth - 20, lineGap: 3 });
      const noteHeight = bodyHeight + 36;
      if (y + noteHeight > tableBottom) {
        addPage(false);
      }
      doc.rect(left, y, contentWidth, noteHeight).fillAndStroke(emphasized ? "#FFF8F4" : "#FFF9F6", emphasized ? ORANGE : "#F6C7B2");
      doc.font("Helvetica-Bold").fontSize(7.2).fillColor(MUTED).text(label, left + 10, y + 10);
      doc.font("Helvetica").fontSize(9).fillColor(INK).text(text, left + 10, y + 26, { width: contentWidth - 20, lineGap: 3 });
      y += noteHeight + 10;
    };

    doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addPage(true);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(INK).text("ARTICLES DEMANDÉS", left, y, { width: contentWidth });
    y += 20;
    const widths = tableHeader();
    standard.forEach((article) => drawRow(article, widths));

    if (outsideCatalogue.length > 0) {
      y += 12;
      drawNote("DEMANDE HORS CATALOGUE", outsideCatalogue.map((article) => {
        const designation = article.article.replace(/^Hors catalogue\s*—\s*/i, "");
        return `${designation} - quantité ${article.quantite}.`;
      }).join(" "), true);
    }
    drawNote("COMMENTAIRE", escapePdfText(order.commentaire));

    footer();
    doc.end();
  });
}
