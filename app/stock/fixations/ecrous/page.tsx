import AppLayout from "@/components/layout/AppLayout";
import BackButton from "@/components/layout/BackButton";
import EcrousStock from "@/components/stock/stock-ecrous";

export default function EcrousPage() {
  return (
    <AppLayout>
      <BackButton href="/stock/fixations" />
      <EcrousStock />
    </AppLayout>
  );
}