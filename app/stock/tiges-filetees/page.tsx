import AppLayout from "@/components/layout/AppLayout";
import BackButton from "@/components/layout/BackButton";
import StockTigesFiletees from "@/components/stock/stock-tiges-filetees";

export default function TigesFileteesStockPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl">
        <div className="pt-2">
          <BackButton href="/stock" />
        </div>

        <StockTigesFiletees />
      </div>
    </AppLayout>
  );
}