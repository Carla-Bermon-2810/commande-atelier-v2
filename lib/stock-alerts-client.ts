"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  StockAlertGroup,
  StockAlertReference,
} from "@/lib/stock-alerts";

export const STOCK_ALERTS_UPDATED_EVENT = "stock-alerts-updated";

export type StockAlertCartLink = {
  catalogueId: number;
  article: string;
  famille: string;
  variante?: string;
  photo?: string;
};

export type StockAlertView = StockAlertReference & {
  stockUrl: string;
  panier: StockAlertCartLink | null;
};

export type StockAlertsPayload = {
  alertes: StockAlertView[];
  global: StockAlertGroup;
  parCategorie: Record<string, StockAlertGroup>;
  parFamille: Record<string, StockAlertGroup>;
};

export function notifyStockAlertsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STOCK_ALERTS_UPDATED_EVENT));
  }
}

export function useStockAlerts() {
  const [data, setData] = useState<StockAlertsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const retryScheduled = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/stock/alertes", { cache: "no-store" });
      if (!response.ok) throw new Error("Impossible de charger les alertes.");
      setData(await response.json() as StockAlertsPayload);
      retryScheduled.current = false;
    } catch {
      // L'interface de stock continue de fonctionner si le compteur est indisponible.
      setData(null);
      // Une clé serveur peut être indisponible pendant un démarrage local : un
      // unique nouvel essai évite d'afficher à tort un état vide.
      if (!retryScheduled.current && typeof window !== "undefined") {
        retryScheduled.current = true;
        window.setTimeout(() => window.dispatchEvent(new Event(STOCK_ALERTS_UPDATED_EVENT)), 900);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    window.addEventListener(STOCK_ALERTS_UPDATED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(STOCK_ALERTS_UPDATED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      window.clearTimeout(timer);
    };
  }, [refresh]);

  return { data, isLoading, refresh };
}
