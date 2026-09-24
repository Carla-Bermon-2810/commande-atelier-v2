export type ProductVariant = {
  dimension?: string | null;
  grain?: string | null;
};

function normaliser(value?: string | null) {
  const texte = value?.trim().replace(/\s+/g, " ") ?? "";
  return texte && texte !== "EMPTY" ? texte : "";
}

export function variantLabel(variant: ProductVariant) {
  return [normaliser(variant.dimension), normaliser(variant.grain)]
    .filter(Boolean)
    .join(" • ") || "Standard";
}

export function variantsUniques(variants: ProductVariant[]) {
  const dejaVus = new Set<string>();
  return variants.filter((variant) => {
    const cle = variantLabel(variant).toLocaleLowerCase("fr");
    if (dejaVus.has(cle)) return false;
    dejaVus.add(cle);
    return true;
  });
}
