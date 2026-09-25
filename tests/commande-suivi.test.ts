import assert from "node:assert/strict";
import test from "node:test";
import { calculerProgressionReception, calculerStatutCommande } from "../lib/commande-suivi.ts";

test("une commande sans réception reste en attente", () => {
  const lignes = [{ quantiteCommandee: 10, quantiteRecue: 0 }];
  assert.equal(calculerStatutCommande(lignes), "En attente");
  assert.deepEqual(calculerProgressionReception(lignes), {
    quantiteCommandee: 10,
    quantiteRecue: 0,
    progression: 0,
  });
});

test("plusieurs réceptions successives donnent une livraison partielle", () => {
  const lignes = [
    { quantiteCommandee: 10, quantiteRecue: 7 },
    { quantiteCommandee: 4, quantiteRecue: 0 },
  ];
  assert.equal(calculerStatutCommande(lignes), "Partiellement livrée");
  assert.equal(calculerProgressionReception(lignes).progression, 50);
});

test("une commande entièrement reçue devient livrée", () => {
  const lignes = [
    { quantiteCommandee: 10, quantiteRecue: 10 },
    { quantiteCommandee: 3, quantiteRecue: 3 },
  ];
  assert.equal(calculerStatutCommande(lignes), "Livrée");
  assert.equal(calculerProgressionReception(lignes).progression, 100);
});

test("une commande annulée garde le statut annulé, quel que soit son historique", () => {
  const lignes = [{ quantiteCommandee: 10, quantiteRecue: 10 }];
  assert.equal(calculerStatutCommande(lignes, true), "Annulée");
});
