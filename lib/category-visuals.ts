export const categoryImages: Record<string, string> = {
  abrasif: "/category-abrasif-v1.png",
  "outils de coupe": "/category-outils-coupe-v1.png",
  "poste soudure": "/category-soudure-v1.png",
  consommable: "/category-consommable-v1.png",
  quincaillerie: "/category-quincaillerie-v1.png",
  epi: "/category-epi-v1.png",
};

export function categoryImage(name: string) {
  return categoryImages[name.trim().toLocaleLowerCase("fr")] ?? "/hero-atelier-v3.png";
}

const normalise = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .trim()
  .toLocaleLowerCase("fr");

const familyImages: Record<string, string> = {
  "abrasif|bandes abrasives": "/family-bandes-abrasives-v1.png",
  "abrasif|brosses metalliques": "/family-brosses-metalliques-v1.png",
  "abrasif|disques": "/family-disques-v1.png",
  "abrasif|plateau ponceuse": "/family-plateaux-ponceuse-v1.png",
  "abrasif|plateaux ponceuse": "/family-plateaux-ponceuse-v1.png",
  "abrasif|roues": "/family-roues-v1.png",
  "abrasif|satinage": "/family-satinage-v1.png",
  "outils de coupe|coffrets": "/family-coffrets-v1.png",
  "outils de coupe|forets": "/family-forets-v1.png",
  "outils de coupe|fraises": "/family-fraises-v1.png",
  "outils de coupe|scies cloches": "/family-scies-cloches-v1.png",
  "outils de coupe|tarauds": "/family-tarauds-v1.png",
};

export function familyImage(category: string, family: string) {
  return familyImages[`${normalise(category)}|${normalise(family)}`] ?? null;
}
