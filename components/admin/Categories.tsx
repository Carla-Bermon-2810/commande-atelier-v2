"use client";

import { useEffect, useState } from "react";
import { adminData } from "@/lib/admin-api";

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
    try { setCategories(await adminData<any[]>("categories", "select", { order: "nom" }) ?? []); } catch (error) { console.error(error); }
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
        await adminData("categories", "update", { values: { nom }, filters: [{ column: "id", value: categorieSelectionnee.id }] });
      } else {
        await adminData("categories", "insert", { values: { nom } });
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
      await adminData("categories", "delete", { values: {}, filters: [{ column: "id", value: categorieSelectionnee.id }] });

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
