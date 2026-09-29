import { notFound } from "next/navigation";
import ReceptionStockPreview from "@/components/commandes/ReceptionStockPreview";
import AppLayout from "@/components/layout/AppLayout";

export const dynamic = "force-dynamic";

const scenarios = new Set(["preview-vis", "preview-tubes", "preview-partiel"]);

export default async function ReceptionStockPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const requestedScenario = (await searchParams).scenario;
  const selectedId = requestedScenario && scenarios.has(requestedScenario) ? requestedScenario : "preview-vis";

  return (
    <AppLayout>
      <ReceptionStockPreview selectedId={selectedId} />
    </AppLayout>
  );
}
