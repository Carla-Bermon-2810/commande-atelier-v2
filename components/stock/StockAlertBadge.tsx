import type { StockAlertGroup } from "@/lib/stock-alerts";

export default function StockAlertBadge({ group, compact = false }: { group?: StockAlertGroup; compact?: boolean }) {
  if (!group || group.nombreAlertes === 0) return null;
  const rupture = group.severiteMaximale === "rupture";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-5 text-white ${rupture ? "bg-red-600" : "bg-[#F95516]"} ${compact ? "min-w-5" : "min-w-6"}`}
      aria-label={`${group.nombreAlertes} référence${group.nombreAlertes > 1 ? "s" : ""} en alerte${rupture ? ", dont une rupture" : ""}`}
    >
      {group.nombreAlertes}
    </span>
  );
}
