import AppLayout from "@/components/layout/AppLayout";
import StockFamilySelector from "@/components/stock/StockFamilySelector";

export default function OutillagePage() {
  return (
    <AppLayout>
      <StockFamilySelector
        backHref="/stock"
        eyebrow="Stock · Outillage"
        title="Outillage"
        description="Choisissez le type d’outil à contrôler ou à compléter."
        items={[
          { href: "/stock/outillage/forets", title: "Forets", image: "/forets.png", detail: "Diamètres et matières de perçage" },
          { href: "/stock/outillage/fraises", title: "Fraises", image: "/fraises.png", detail: "Formes et diamètres de fraisage" },
          { href: "/stock/outillage/tarauds", title: "Tarauds", image: "/tarauds.png", detail: "Filetages et dimensions disponibles" },
        ]}
      />
    </AppLayout>
  );
}
