import AppLayout from "@/components/layout/AppLayout";
import StockFamilySelector from "@/components/stock/StockFamilySelector";

export default function TubesPage() {
  return (
    <AppLayout>
      <StockFamilySelector
        backHref="/stock"
        eyebrow="Stock · Tubes"
        title="Tubes"
        description="Choisissez une matière pour consulter les longueurs disponibles."
        items={[
          { href: "/stock/tubes/acier", title: "Acier", image: "/tube acier.png", detail: "Sections et longueurs acier" },
          { href: "/stock/tubes/inox", title: "Inox", image: "/tube inox.png", detail: "Sections et longueurs inox" },
          { href: "/stock/tubes/alu", title: "Aluminium", image: "/tube alu.png", detail: "Sections et longueurs aluminium" },
        ]}
      />
    </AppLayout>
  );
}
