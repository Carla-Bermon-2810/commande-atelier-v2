import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTigeReferenceKey,
  buildTubeReferenceKey,
  calculateStockAlertStatus,
  createStockAlertsSnapshot,
  getStockAlertGroup,
} from "../lib/stock-alerts.ts";

test("les seuils en quantité donnent OK, à recommander et rupture dans cet ordre", () => {
  assert.equal(calculateStockAlertStatus(11, 10), "ok");
  assert.equal(calculateStockAlertStatus(10, 10), "a_recommander");
  assert.equal(calculateStockAlertStatus(9, 10), "a_recommander");
  assert.equal(calculateStockAlertStatus(0, 10), "rupture");
});

test("une longueur sans seuil reste non définie, sauf si elle est à zéro", () => {
  assert.equal(calculateStockAlertStatus(1200, null), "non_defini");
  assert.equal(calculateStockAlertStatus(0, null), "rupture");
  assert.equal(buildTigeReferenceKey({ matiere: "Inox", diametre: "Ø 8" }), buildTigeReferenceKey({ matiere: "inox", diametre: "Ø8" }));
});

test("les tubes additionnent toutes les chutes d'une même référence en millimètres", () => {
  const tube = { matiere: "inox", type: "carre", section: "40x40", epaisseur: 2, nuance: "304L" };
  const key = buildTubeReferenceKey(tube);
  const snapshot = createStockAlertsSnapshot({
    tubes: [
      { id: 1, ...tube, longueur_disponible: 700, statut: "disponible" },
      { id: 2, ...tube, longueur_disponible: 500, statut: "disponible" },
      { id: 3, ...tube, longueur_disponible: 5000, statut: "utilise" },
    ],
    tigesFiletees: [],
    seuilsLongueur: [{ source: "tubes", reference_key: key, seuil_mm: 1000 }],
    vis: [], ecrous: [], rivets: [], inserts: [], forets: [], fraises: [], tarauds: [],
  });

  assert.equal(snapshot.references[0].stockActuel, 1200);
  assert.equal(snapshot.references[0].unite, "mm");
  assert.equal(snapshot.references[0].statut, "ok");
});

test("une somme de chutes sous le seuil reste une seule alerte de référence", () => {
  const tube = { matiere: "inox", type: "rond", section: "42.4", epaisseur: 2, nuance: "304L" };
  const key = buildTubeReferenceKey(tube);
  const snapshot = createStockAlertsSnapshot({
    tubes: [
      { id: 1, ...tube, longueur_disponible: 300, statut: "disponible" },
      { id: 2, ...tube, longueur_disponible: 400, statut: "disponible" },
    ],
    tigesFiletees: [],
    seuilsLongueur: [{ source: "tubes", reference_key: key, seuil_mm: 1000 }],
    vis: [], ecrous: [], rivets: [], inserts: [], forets: [], fraises: [], tarauds: [],
  });

  assert.equal(snapshot.alertes.length, 1);
  assert.equal(snapshot.alertes[0].stockActuel, 700);
  assert.equal(snapshot.alertes[0].statut, "a_recommander");
  assert.equal(snapshot.parFamille.get("Tubes:Inox")?.nombreAlertes, 1);
});

test("modifier le seuil ne modifie jamais la longueur calculée", () => {
  const tube = { matiere: "acier", type: "carre", section: "30x30", epaisseur: 2, nuance: "S235" };
  const key = buildTubeReferenceKey(tube);
  const input = {
    tubes: [
      { id: 1, ...tube, longueur_disponible: 1200, statut: "disponible" as const },
      { id: 2, ...tube, longueur_disponible: 500, statut: "disponible" as const },
    ],
    tigesFiletees: [],
    vis: [], ecrous: [], rivets: [], inserts: [], forets: [], fraises: [], tarauds: [],
  };
  const sansSeuil = createStockAlertsSnapshot({ ...input, seuilsLongueur: [] });
  const avecSeuil = createStockAlertsSnapshot({
    ...input,
    seuilsLongueur: [{ source: "tubes" as const, reference_key: key, seuil_mm: 2000 }],
  });

  assert.equal(sansSeuil.references[0].stockActuel, 1700);
  assert.equal(avecSeuil.references[0].stockActuel, 1700);
  assert.equal(avecSeuil.references[0].statut, "a_recommander");
});

test("l'agrégation compte les références problématiques et conserve une rupture prioritaire", () => {
  const snapshot = createStockAlertsSnapshot({
    tubes: [], tigesFiletees: [], seuilsLongueur: [], vis: [], ecrous: [], rivets: [], inserts: [],
    forets: [
      { id: 1, dimension: "Ø 8", quantite: 2, seuil_minimum: 2 },
      { id: 2, dimension: "Ø 10", quantite: 0, seuil_minimum: 2 },
    ],
    fraises: [], tarauds: [],
  });
  const outillage = snapshot.parCategorie.get("Outillage");

  assert.equal(outillage?.nombreAlertes, 2);
  assert.equal(outillage?.severiteMaximale, "rupture");
  assert.equal(snapshot.global.severiteMaximale, "rupture");
  assert.deepEqual(getStockAlertGroup(snapshot.references), snapshot.global);
});
