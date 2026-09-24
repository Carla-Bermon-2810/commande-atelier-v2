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
