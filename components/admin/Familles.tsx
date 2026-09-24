"use client";

import { useEffect, useState } from "react";
import { adminData } from "@/lib/admin-api";

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
    try { setFamilles(await adminData<any[]>("famille", "select", { order: "categorie" }) ?? []); } catch (error) { console.error(error); }
  }

  async function chargerCategories() {
    try { setCategories(await adminData<any[]>("categories", "select", { order: "nom" }) ?? []); } catch (error) { console.error(error); }
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
        await adminData("famille", "update", { values: { famille, categorie, ordre }, filters: [{ column: "id", value: familleSelectionnee.id }] });
      } else {
        await adminData("famille", "insert", { values: { famille, categorie, ordre } });
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
      await adminData("famille", "delete", { values: {}, filters: [{ column: "id", value: familleSelectionnee.id }] });

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
