import AppLayout from "@/components/layout/AppLayout";
import BackButton from "@/components/layout/BackButton";
import Stock from "@/components/stock/stock";

export default function TubesInoxPage() {
  return (
    <AppLayout>
      <BackButton href="/stock/tubes" />
      <Stock matiere="inox" />
    </AppLayout>
  );
}