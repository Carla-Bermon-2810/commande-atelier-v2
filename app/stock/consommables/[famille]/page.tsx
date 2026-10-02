import AppLayout from "@/components/layout/AppLayout";
import StockCatalogueArticleList from "@/components/stock/StockCatalogueArticleList";

export default async function StockConsommablesFamilyPage({ params }: { params: Promise<{ famille: string }> }) { const { famille } = await params; return <AppLayout><StockCatalogueArticleList type="consommables" family={famille === "toutes" ? undefined : famille} /></AppLayout>; }
