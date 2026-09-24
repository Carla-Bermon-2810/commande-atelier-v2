import AppLayout from "@/components/layout/AppLayout";
import StockFamilySelector from "@/components/stock/StockFamilySelector";

export default function FixationsPage() {
  return (
    <AppLayout>
      <StockFamilySelector
        backHref="/stock"
        eyebrow="Stock · Fixations"
        title="Fixations"
        description="Choisissez une famille pour contrôler les références et les seuils."
        items={[
          { href: "/stock/fixations/vis", title: "Vis", image: "/vis.jpg", detail: "Références, dimensions et conditionnements" },
          { href: "/stock/fixations/ecrous", title: "Écrous", image: "/ecrou.webp", detail: "Références, dimensions et conditionnements" },
          { href: "/stock/fixations/inserts", title: "Inserts", image: "/insert.webp", detail: "Références, matières et dimensions" },
          { href: "/stock/fixations/rivets", title: "Rivets", image: "/rivets-v2.png", detail: "Références, matières et niveaux de stock" },
        ]}
      />
    </AppLayout>
  );
}
