"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import CategoryList from "./CategoryList";
import CategoryForm from "./CategoryForm";

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);

  const [categorieSelectionnee, setCategorieSelectionnee] = useState<any>(null);

  const [nom, setNom] = useState("");

  useEffect(() => {
    chargerCategories();
  }, []);

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

  function nouvelleCategorie() {
    setCategorieSelectionnee({
      id: null,
      nom: "",
    });

    setNom("");
  }

  function selectionner(cat: any) {
    setCategorieSelectionnee(cat);
    setNom(cat.nom);
  }

  async function enregistrer() {
    if (!nom.trim()) {
      alert("Veuillez saisir un nom.");
      return;
    }

    try {
      if (categorieSelectionnee?.id) {
        const { error } = await supabase
          .from("categories")
          .update({
            nom,
          })
          .eq("id", categorieSelectionnee.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("categories")
          .insert({
            nom,
          });

        if (error) throw error;
      }

      await chargerCategories();

      setCategorieSelectionnee(null);

      setNom("");

      alert("Catégorie enregistrée.");
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  }

  async function supprimer() {
    if (!categorieSelectionnee?.id) return;

    if (
      !confirm(
        `Supprimer "${categorieSelectionnee.nom}" ?`
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categorieSelectionnee.id);

      if (error) throw error;

      setCategorieSelectionnee(null);

      setNom("");

      await chargerCategories();

      alert("Catégorie supprimée.");
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  }

  return (
    <div className="grid grid-cols-[350px_1fr] gap-6">
      <CategoryList
        categories={categories}
        categorieSelectionnee={categorieSelectionnee}
        onSelect={selectionner}
        onNew={nouvelleCategorie}
      />

      <CategoryForm
        nom={nom}
        setNom={setNom}
        categorieSelectionnee={categorieSelectionnee}
        onSave={enregistrer}
        onDelete={supprimer}
      />
    </div>
  );
}