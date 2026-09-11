import AppLayout from "@/components/layout/AppLayout";
import BackButton from "@/components/layout/BackButton";
import VisStock from "@/components/stock/stock-vis";

export default function VisPage() {
  return (
    <AppLayout>
      <BackButton href="/stock/fixations" />
      <VisStock />
    </AppLayout>
  );
}