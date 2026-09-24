"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, PackagePlus, Send, Trash2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useCart } from "@/context/cart-context";
import CartItem from "@/components/cart/CartItem";

type Feedback = { type: "error" | "success"; message: string } | null;

export default function PanierPage() {
  const { cart, clearCart, addToCart } = useCart();
  const [demandeur, setDemandeur] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [referenceManuelle, setReferenceManuelle] = useState("");
  const [quantiteManuelle, setQuantiteManuelle] = useState(1);

  function ajouterReferenceManuelle() {
    const reference = referenceManuelle.trim();

    if (!reference) {
      setFeedback({ type: "error", message: "Indiquez la référence ou la désignation à commander." });
      return;
    }

    const quantite = Number.isInteger(quantiteManuelle)
      ? Math.min(10_000, Math.max(1, quantiteManuelle))
      : 1;

    addToCart({
      article: `Hors catalogue — ${reference}`,
      famille: "Demande hors catalogue",
      quantite,
    });
    setReferenceManuelle("");
    setQuantiteManuelle(1);
    setFeedback({ type: "success", message: "La référence a été ajoutée au panier pour traitement par l’atelier." });
  }

  async function envoyerCommande() {
    if (isSubmitting) return;

    if (!demandeur.trim()) {
      setFeedback({ type: "error", message: "Indiquez le nom du demandeur avant d’envoyer la commande." });
      return;
    }

    if (cart.length === 0) {
      setFeedback({ type: "error", message: "Le panier est vide." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/send-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demandeur, commentaire, articles: cart }),
      });
      const result: { message?: string; numero?: string; success?: boolean } = await response.json();

      if (!response.ok || !result.success) {
        setFeedback({ type: "error", message: result.message ?? "La commande n’a pas pu être envoyée. Réessayez." });
        return;
      }

      clearCart();
      setCommentaire("");
      setDemandeur("");
      setFeedback({ type: "success", message: `Commande ${result.numero ?? ""} envoyée avec succès.` });
    } catch {
      setFeedback({ type: "error", message: "Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl py-4">
        <div className="relative mb-5 overflow-hidden rounded-xl bg-[#142026] p-6 text-white sm:p-8" style={{ backgroundImage: "linear-gradient(90deg, rgba(10,20,26,.96), rgba(10,20,26,.72), rgba(10,20,26,.36)), url('/category-soudure-v1.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8d5c]">Commande Atelier</p>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Votre panier</h1>
          <p className="mt-1 text-sm text-slate-200">{cart.length} article{cart.length > 1 ? "s" : ""} · Vérifiez les quantités avant l’envoi.</p>
        </div>

        {feedback && (
          <div
            role="status"
            className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium ${
              feedback.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {feedback.type === "success" && <CheckCircle2 className="mt-0.5 shrink-0" size={20} />}
            <span>{feedback.message}</span>
          </div>
        )}

        <section className="mb-5 rounded-xl border border-orange-200 bg-orange-50 p-4 sm:p-5" aria-labelledby="hors-catalogue-title">
          <div className="flex gap-3">
            <PackagePlus className="mt-0.5 shrink-0 text-[#F95516]" size={22} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h2 id="hors-catalogue-title" className="font-bold text-[#2F3437]">Article introuvable dans le catalogue ?</h2>
              <p className="mt-1 text-sm text-slate-600">Ajoutez sa référence ou sa désignation : l’atelier la recevra comme une demande hors catalogue.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_auto]">
                <label className="sr-only" htmlFor="reference-manuelle">Référence ou désignation</label>
                <input
                  id="reference-manuelle"
                  type="text"
                  value={referenceManuelle}
                  onChange={(event) => setReferenceManuelle(event.target.value)}
                  maxLength={140}
                  placeholder="Ex. disque à tronçonner Ø 125"
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-base"
                />
                <label className="sr-only" htmlFor="quantite-manuelle">Quantité</label>
                <input
                  id="quantite-manuelle"
                  type="number"
                  min="1"
                  max="10000"
                  value={quantiteManuelle}
                  onChange={(event) => setQuantiteManuelle(Number(event.target.value))}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-base"
                />
                <button type="button" onClick={ajouterReferenceManuelle} className="min-h-12 rounded-xl border border-[#F95516] bg-white px-4 font-semibold text-[#c43f10] hover:bg-orange-100">Ajouter</button>
              </div>
            </div>
          </div>
        </section>

        {feedback?.type === "success" && cart.length === 0 ? (
          <section className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={34} /></span>
            <h2 className="mt-4 text-2xl font-bold">Demande envoyée !</h2>
            <p className="mt-2 text-sm text-slate-600">{feedback.message}</p>
            <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#F95516] px-5 text-sm font-bold text-white hover:bg-[#e04d13]">Retour au catalogue</Link>
          </section>
        ) : cart.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-xl font-bold text-[#2F3437]">Votre panier est vide.</p>
            <p className="mt-2 text-slate-500">Ajoutez des articles depuis le catalogue pour créer une commande.</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">Produits de votre demande</div>
              {cart.map((article) => <CartItem key={article.article} article={article} />)}
            </div>

            <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 sm:p-6">
              <h2 className="text-xl font-bold text-[#2F3437]">Informations de la commande</h2>
              <p className="mt-1 text-sm text-slate-500">Les champs marqués d’un astérisque sont obligatoires.</p>

              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="demandeur" className="mb-2 block text-sm font-semibold text-slate-700">Demandeur *</label>
                  <input
                    id="demandeur"
                    type="text"
                    value={demandeur}
                    onChange={(event) => setDemandeur(event.target.value)}
                    placeholder="Votre nom"
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label htmlFor="commentaire" className="mb-2 block text-sm font-semibold text-slate-700">Commentaire</label>
                  <textarea
                    id="commentaire"
                    value={commentaire}
                    onChange={(event) => setCommentaire(event.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder="Ex. besoin avant vendredi…"
                    disabled={isSubmitting}
                    className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-base disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
              </div>

              {confirmClear ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-800">Vider entièrement le panier ?</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setConfirmClear(false)} className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 font-semibold text-slate-700">Annuler</button>
                    <button type="button" onClick={() => { clearCart(); setConfirmClear(false); }} className="min-h-12 rounded-xl bg-red-600 px-3 font-semibold text-white hover:bg-red-700">Vider</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmClear(true)} disabled={isSubmitting} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
                  <Trash2 size={18} /> Vider le panier
                </button>
              )}

              <button type="button" onClick={envoyerCommande} disabled={isSubmitting} className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#F95516] px-4 text-base font-bold text-white shadow-sm hover:bg-[#e04d13] disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Envoi en cours…</> : <><Send size={20} /> Envoyer la commande</>}
              </button>
            </aside>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
