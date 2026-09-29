"use client";

import { useMemo, useState } from "react";
import { PackagePlus, ShoppingCart, X } from "lucide-react";

import { useCart, type CartItem } from "@/context/cart-context";

export type StockOrderTarget = {
  source: NonNullable<CartItem["stockReference"]>["source"];
  referenceId?: number;
  referenceKey: string;
  article: string;
  famille: string;
  photo?: string;
  stockActuel: number;
  seuil: number | null;
  uniteStock: "pieces" | "mm";
  piecesParBoite?: number | null;
  configuration?: Record<string, string | number | null>;
};

function format(value: number) {
  return value.toLocaleString("fr-FR");
}

export function StockOrderButton({ target, compact = false }: { target: StockOrderTarget; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const { addToCart } = useCart();
  const missing = target.seuil === null ? null : Math.max(0, target.seuil - target.stockActuel);
  const packSize = target.uniteStock === "pieces" && (target.piecesParBoite ?? 0) > 0 ? Math.floor(target.piecesParBoite ?? 0) : null;
  const initialQuantity = useMemo(() => {
    if (target.uniteStock === "mm") return 1;
    if (missing === null || missing === 0) return 1;
    return packSize ? Math.ceil(missing / packSize) : Math.ceil(missing);
  }, [missing, packSize, target.uniteStock]);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [length, setLength] = useState("");

  function openModal() {
    setQuantity(initialQuantity);
    setLength("");
    setOpen(true);
  }

  const lengthPerBar = Number(length);
  const addedToStock = target.uniteStock === "mm"
    ? (Number.isInteger(quantity) && quantity > 0 && Number.isFinite(lengthPerBar) && lengthPerBar > 0 ? quantity * lengthPerBar : null)
    : quantity * (packSize ?? 1);
  const canConfirm = Number.isInteger(quantity) && quantity > 0 && addedToStock !== null;
  const commandUnit = target.uniteStock === "mm" ? "barre" : packSize ? "boîte" : "pièce";
  const commandLabel = quantity > 1 ? `${commandUnit}s` : commandUnit;

  function confirm() {
    if (!canConfirm || addedToStock === null) return;
    const suffix = target.uniteStock === "mm"
      ? `${quantity} ${commandLabel} × ${format(lengthPerBar)} mm`
      : packSize
        ? `${quantity} ${commandLabel} de ${format(packSize)} pièces (${format(addedToStock)} pièces)`
        : `${quantity} pièce${quantity > 1 ? "s" : ""}`;
    addToCart({
      article: target.article,
      famille: target.famille,
      photo: target.photo,
      variante: `Commande stock · ${suffix}`,
      quantite: quantity,
      stockReference: {
        source: target.source,
        referenceId: target.referenceId,
        referenceKey: target.referenceKey,
        uniteCommande: target.uniteStock === "mm" ? "barre" : packSize ? "boite" : "piece",
        uniteStock: target.uniteStock,
        facteurConversion: target.uniteStock === "mm" ? lengthPerBar : (packSize ?? 1),
        longueurParBarreMm: target.uniteStock === "mm" ? lengthPerBar : undefined,
        configuration: target.configuration,
      },
    });
    setOpen(false);
  }

  return <>
    <button type="button" onClick={openModal} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#F95516] font-semibold text-white transition hover:bg-[#e04d13] focus:outline-none focus:ring-2 focus:ring-orange-300 ${compact ? "px-3 text-sm" : "px-4 text-sm"}`}>
      <ShoppingCart size={17} />{compact ? "Ajouter" : "Ajouter au panier"}
    </button>

    {open && <div role="presentation" className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={() => setOpen(false)}>
      <section role="dialog" aria-modal="true" aria-labelledby="stock-order-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-7">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F95516]">Commande depuis le stock</p><h2 id="stock-order-title" className="mt-1 text-xl font-black text-[#17232b]">Vérifier le réapprovisionnement</h2></div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Fermer"><X size={20} /></button>
        </header>
        <div className="space-y-5 px-5 py-6 sm:px-7">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-bold text-[#17232b]">{target.article}</p><p className="mt-1 text-sm text-slate-500">Référence stock : {target.referenceKey}</p></div>
          <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Stock actuel</p><p className="mt-1 font-bold text-[#17232b]">{format(target.stockActuel)} {target.uniteStock}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Seuil minimum</p><p className="mt-1 font-bold text-[#17232b]">{target.seuil === null ? "Non défini" : `${format(target.seuil)} ${target.uniteStock}`}</p></div><div className="rounded-xl bg-orange-50 p-3"><p className="text-xs text-slate-500">Manque calculé</p><p className="mt-1 font-bold text-[#c2410c]">{missing === null ? "À définir" : `${format(missing)} ${target.uniteStock}`}</p></div></div>
          {target.uniteStock === "mm" ? <div className="space-y-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-4"><p className="text-sm font-semibold text-[#17232b]">Longueur commerciale à commander</p><p className="text-xs leading-5 text-slate-600">Aucune longueur de barre n’est déduite automatiquement : renseignez la longueur réellement commandée.</p><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Nombre de barres<input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.floor(Number(event.target.value) || 1)))} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-bold outline-none focus:border-[#F95516]" /></label><label className="text-sm font-semibold text-slate-700">Longueur par barre (mm)<input autoFocus type="number" min="1" step="1" value={length} onChange={(event) => setLength(event.target.value)} placeholder="Ex. 6 000" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-bold outline-none focus:border-[#F95516]" /></label></div></div> : <div className="rounded-2xl border border-slate-200 p-4"><p className="text-sm font-semibold text-[#17232b]">Quantité à commander</p>{packSize ? <p className="mt-1 text-xs text-slate-500">Conditionnement connu : {format(packSize)} pièces par boîte. La proposition est arrondie au nombre entier de boîtes.</p> : <p className="mt-1 text-xs text-slate-500">Aucun conditionnement fiable n’est enregistré : la commande est exprimée en pièces.</p>}<label className="mt-3 block text-sm font-semibold text-slate-700">{packSize ? "Nombre de boîtes" : "Nombre de pièces"}<input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.floor(Number(event.target.value) || 1)))} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-bold outline-none focus:border-[#F95516]" /></label></div>}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm"><p className="font-semibold text-emerald-900">Après réception complète</p>{addedToStock === null ? <p className="mt-1 text-emerald-800">Renseignez la longueur par barre pour calculer le stock prévisionnel.</p> : <p className="mt-1 text-emerald-800">{format(target.stockActuel)} + {format(addedToStock)} = <strong>{format(target.stockActuel + addedToStock)} {target.uniteStock}</strong></p>}</div>
        </div>
        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-5 sm:flex-row sm:justify-end sm:px-7"><button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50">Annuler</button><button type="button" disabled={!canConfirm} onClick={confirm} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#F95516] px-5 text-sm font-bold text-white hover:bg-[#e04d13] disabled:cursor-not-allowed disabled:opacity-45"><PackagePlus size={18} />Ajouter au panier</button></footer>
      </section>
    </div>}
  </>;
}
