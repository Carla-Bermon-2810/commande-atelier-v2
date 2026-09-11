import AppLayout from "@/components/layout/AppLayout";
import BackButton from "@/components/layout/BackButton";
import InsertsStock from "@/components/stock/stock-inserts";

export default function InsertsPage() {
  return (
    <AppLayout>
      <BackButton href="/stock/fixations" />
      <InsertsStock />
    </AppLayout>
  );
}