import AppLayout from "@/components/layout/AppLayout";
import BackButton from "@/components/layout/BackButton";
import StockRivets from "@/components/stock/stock-rivets";

export default function RivetsPage() {
  return (
    <AppLayout>
      <BackButton href="/stock/fixations" />
      <StockRivets />
    </AppLayout>
  );
}
