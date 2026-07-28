"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import FamilleList from "./FamilleList";
import FamilleForm from "./FamilleForm";

export default function Familles() {
  const [familles, setFamilles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [familleSelectionnee, setFamilleSelectionnee] = useState<any>(null);

  const [famille, setFamille] = useState("");
  const [categorie, setCategorie] = useState("");
  const [ordre, setOrdre] = useState(1);

  useEffect(() => {
    chargerFamilles();
    chargerCategories();
  }, []);

  async function chargerFamilles() {
    const { data, error } = await supabase
      .from("famille")
      .select("*")
      .order("categorie")
      .order("ordre");

    if (error) {
      console.error(error);
      return;
    }

    setFamilles(data ?? []);
  }

  async function chargerCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("nom");

    if (error) {
      console.error(error);
      return;
    }

    setCategories(data ?? []);
  }

  function nouvelleFamille() {
    setFamilleSelectionnee({
      id: null,
    });

    setFamille("");
    setCategorie("");
    setOrdre(1);
  }

  function selectionner(f: any) {
    setFamilleSelectionnee(f);

    setFamille(f.famille);
    setCategorie(f.categorie);
    setOrdre(f.ordre);

  }

  async function enregistrer() {
    if (!famille.trim()) {
      alert("Veuillez saisir un nom.");
      return;
    }

    if (!categorie) {
      alert("Veuillez sélectionner une catégorie.");
      return;
    }

    try {
      if (familleSelectionnee?.id) {
        const { error } = await supabase
          .from("famille")
          .update({
            famille,
            categorie,
            ordre,
          })
          .eq("id", familleSelectionnee.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("famille")
          .insert({
            famille,
            categorie,
            ordre,
          });

        if (error) throw error;
      }

      await chargerFamilles();

      setFamilleSelectionnee(null);
      setFamille("");
      setCategorie("");
      setOrdre(1);

      alert("Famille enregistrée.");
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  }

  async function supprimer() {
    if (!familleSelectionnee?.id) return;

    const confirmation = confirm(
      `Supprimer "${familleSelectionnee.famille}" ?`
    );

    if (!confirmation) return;

    try {
      const { error } = await supabase
        .from("famille")
        .delete()
        .eq("id", familleSelectionnee.id);

      if (error) throw error;

      setFamilleSelectionnee(null);
      setFamille("");
      setCategorie("");
      setOrdre(1);

      await chargerFamilles();

      alert("Famille supprimée.");
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  }

  return (
    <div className="grid grid-cols-[350px_1fr] gap-6">

      <FamilleList
        familles={familles}
        familleSelectionnee={familleSelectionnee}
        onSelect={selectionner}
        onNew={nouvelleFamille}
      />

      <FamilleForm
        famille={famille}
        setFamille={setFamille}
        categorie={categorie}
        setCategorie={setCategorie}
        ordre={ordre}
        setOrdre={setOrdre}
        categories={categories}
        familleSelectionnee={familleSelectionnee}
        onSave={enregistrer}
        onDelete={supprimer}
      />

    </div>
  );
}