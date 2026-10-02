export type StockAlertStatus = "ok" | "a_recommander" | "rupture";
export type StockAlertDisplayStatus = StockAlertStatus | "non_defini";
export type StockAlertUnit = "mm" | "pieces" | "unites";
export type StockAlertSource =
  | "tubes"
  | "tiges_filetees"
  | "vis"
  | "ecrous"
  | "inserts"
  | "rivets"
  | "forets"
  | "fraises"
  | "tarauds"
  | "abrasifs"
  | "soudure"
  | "epi"
  | "consommables";

export type StockAlertReference = {
  id: string;
  source: StockAlertSource;
  categorie: "Tubes" | "Tiges filetées" | "Fixations" | "Outillage" | "Abrasifs" | "Soudure" | "EPI" | "Consommables";
  famille: string;
  referenceKey: string;
  libelle: string;
  stockActuel: number;
  seuil: number | null;
  unite: StockAlertUnit;
  /** Conditionnement fiable lorsqu'il est connu pour une référence en pièces. */
  piecesParBoite?: number;
  statut: StockAlertDisplayStatus;
};

export type StockAlertGroup = {
  nombreReferences: number;
  nombreAlertes: number;
  severiteMaximale: StockAlertStatus;
};

export type TubeStockRow = {
  id: number | string;
  matiere: string;
  type: string;
  section: string;
  epaisseur: number | string | null;
  nuance: string | null;
  longueur_disponible: number | string | null;
  statut: "disponible" | "utilise";
};

export type TigeStockRow = {
  id: number | string;
  matiere: string;
  diametre: string;
  longueur_disponible: number | string | null;
  statut: "disponible" | "utilise";
};

export type StockAvecBoitesRow = {
  id: number | string;
  reference: string;
  designation?: string | null;
  matiere?: string | null;
  dimension?: string | null;
  pieces_par_boite: number | string | null;
  boites_pleines: number | string | null;
  pieces_restantes: number | string | null;
  seuil_boites: number | string | null;
};

export type StockQuantiteRow = {
  id: number | string;
  reference?: string | null;
  designation?: string | null;
  dimension?: string | null;
  matiere?: string | null;
  quantite: number | string | null;
  seuil_minimum: number | string | null;
};

export type StockArticleCatalogueRow = {
  id: number | string;
  stock_type: "abrasifs" | "soudure" | "epi" | "consommables";
  famille_catalogue_snapshot: string;
  designation_snapshot: string;
  quantite_disponible: number | string | null;
  seuil_minimum: number | string | null;
  etat_initialisation: "a_initialiser" | "initialise";
  unite_libelle: string | null;
  conditionnement_label: string | null;
};

export type StockAlertSnapshotInput = {
  tubes: TubeStockRow[];
  tigesFiletees: TigeStockRow[];
  seuilsLongueur: Array<{
    source: "tubes" | "tiges_filetees";
    reference_key: string;
    seuil_mm: number | string;
  }>;
  vis: StockAvecBoitesRow[];
  ecrous: StockAvecBoitesRow[];
  rivets: StockAvecBoitesRow[];
  inserts: StockQuantiteRow[];
  forets: StockQuantiteRow[];
  fraises: StockQuantiteRow[];
  tarauds: StockQuantiteRow[];
  /** Optionnel pour conserver la compatibilité des appels historiques et des tests. */
  articlesCatalogue?: StockArticleCatalogueRow[];
};

const severity: Record<StockAlertDisplayStatus, number> = {
  non_defini: 0,
  ok: 0,
  a_recommander: 1,
  rupture: 2,
};

function numberOrZero(value: number | string | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function text(value: string | number | null | undefined) {
  return String(value ?? "").trim();
}

function normalise(value: string | number | null | undefined) {
  return text(value).toLocaleLowerCase("fr-FR").replace(/\s+/g, " ");
}

function humanise(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase("fr-FR"));
}

export function buildTubeReferenceKey(row: Pick<TubeStockRow, "matiere" | "type" | "section" | "epaisseur" | "nuance">) {
  return [row.matiere, row.type, row.section, row.epaisseur ?? "", row.nuance ?? ""]
    .map(normalise)
    .join("|");
}

export function buildTigeReferenceKey(row: Pick<TigeStockRow, "matiere" | "diametre">) {
  const diametre = text(row.diametre).replace(/\s+/g, "");
  return [normalise(row.matiere), normalise(diametre.startsWith("Ø") ? diametre : `Ø${diametre}`)].join("|");
}

/** Le seuil est inclus dans l'alerte seulement après la priorité absolue de rupture. */
export function calculateStockAlertStatus(stockActuel: number, seuil?: number | null): StockAlertDisplayStatus {
  const stock = numberOrZero(stockActuel);

  if (stock === 0) return "rupture";
  if (seuil === null || seuil === undefined) return "non_defini";

  const threshold = numberOrZero(seuil);
  if (stock <= threshold) return "a_recommander";
  return "ok";
}

export function stockAlertStatusLabel(statut: StockAlertDisplayStatus) {
  if (statut === "rupture") return "Rupture";
  if (statut === "a_recommander") return "À recommander";
  if (statut === "non_defini") return "Non défini";
  return "OK";
}

export function getStockAlertGroup(references: StockAlertReference[]): StockAlertGroup {
  const nombreAlertes = references.filter((reference) => reference.statut === "a_recommander" || reference.statut === "rupture").length;
  const statutMaximum = references.reduce<StockAlertDisplayStatus>(
    (highest, reference) =>
      severity[reference.statut] > severity[highest] ? reference.statut : highest,
    "ok",
  );

  return {
    nombreReferences: references.length,
    nombreAlertes,
    severiteMaximale: statutMaximum === "non_defini" ? "ok" : statutMaximum,
  };
}

export function groupStockAlertsBy<T extends string>(
  references: StockAlertReference[],
  selector: (reference: StockAlertReference) => T,
) {
  const groups = new Map<T, StockAlertReference[]>();
  for (const reference of references) {
    const key = selector(reference);
    const current = groups.get(key) ?? [];
    current.push(reference);
    groups.set(key, current);
  }

  return new Map(Array.from(groups, ([key, items]) => [key, getStockAlertGroup(items)]));
}

function buildLengthAlerts<T extends TubeStockRow | TigeStockRow>(args: {
  rows: T[];
  source: "tubes" | "tiges_filetees";
  categorie: "Tubes" | "Tiges filetées";
  keyFor: (row: T) => string;
  labelFor: (row: T) => string;
  familyFor: (row: T) => string;
  thresholds: Map<string, number>;
}) {
  const groups = new Map<string, T[]>();
  for (const row of args.rows) {
    const key = args.keyFor(row);
    const items = groups.get(key) ?? [];
    items.push(row);
    groups.set(key, items);
  }

  return Array.from(groups, ([referenceKey, rows]) => {
    const first = rows[0];
    const stockActuel = rows.reduce(
      (total, row) => total + (row.statut === "disponible" ? numberOrZero(row.longueur_disponible) : 0),
      0,
    );
    const seuil = args.thresholds.get(`${args.source}:${referenceKey}`) ?? null;

    return {
      id: `${args.source}:${referenceKey}`,
      source: args.source,
      categorie: args.categorie,
      famille: args.familyFor(first),
      referenceKey,
      libelle: args.labelFor(first),
      stockActuel,
      seuil,
      unite: "mm",
      statut: calculateStockAlertStatus(stockActuel, seuil),
    } satisfies StockAlertReference;
  });
}

function buildBoxAlerts(args: {
  rows: StockAvecBoitesRow[];
  source: "vis" | "ecrous" | "rivets";
  famille: string;
}) {
  return args.rows.map((row) => {
    const stockEnBoites = numberOrZero(row.boites_pleines) * numberOrZero(row.pieces_par_boite);
    // Les vis ne sont plus suivies au détail : les reliquats historiques ne
    // participent donc pas à leur niveau d'alerte.
    const stockActuel = args.source === "vis"
      ? stockEnBoites
      : stockEnBoites + numberOrZero(row.pieces_restantes);
    const seuil = numberOrZero(row.seuil_boites) * numberOrZero(row.pieces_par_boite);
    const referenceKey = text(row.reference) || String(row.id);
    const libelle = [text(row.designation), text(row.reference), text(row.dimension)].filter(Boolean).join(" · ");

    return {
      id: `${args.source}:${row.id}`,
      source: args.source,
      categorie: "Fixations",
      famille: args.famille,
      referenceKey,
      libelle: libelle || args.famille,
      stockActuel,
      seuil,
      unite: "pieces",
      piecesParBoite: numberOrZero(row.pieces_par_boite) || undefined,
      statut: calculateStockAlertStatus(stockActuel, seuil),
    } satisfies StockAlertReference;
  });
}

function buildQuantityAlerts(args: {
  rows: StockQuantiteRow[];
  source: "inserts" | "forets" | "fraises" | "tarauds";
  categorie: "Fixations" | "Outillage";
  famille: string;
}) {
  return args.rows.map((row) => {
    const referenceKey = text(row.reference) || text(row.dimension) || String(row.id);
    const libelle = [text(row.designation), text(row.reference), text(row.dimension)].filter(Boolean).join(" · ");
    const stockActuel = numberOrZero(row.quantite);
    const seuil = numberOrZero(row.seuil_minimum);

    return {
      id: `${args.source}:${row.id}`,
      source: args.source,
      categorie: args.categorie,
      famille: args.famille,
      referenceKey,
      libelle: libelle || args.famille,
      stockActuel,
      seuil,
      unite: "pieces",
      statut: calculateStockAlertStatus(stockActuel, seuil),
    } satisfies StockAlertReference;
  });
}

function buildCatalogueArticleAlerts(rows: StockArticleCatalogueRow[]) {
  return rows
    // Une référence non initialisée ne représente ni un stock à zéro, ni une
    // alerte. Elle est volontairement exclue du moteur jusqu'à la saisie
    // explicite de son unité, sa quantité et son seuil.
    .filter((row) => row.etat_initialisation === "initialise")
    .map((row) => {
      const source = row.stock_type;
      const categorie: StockAlertReference["categorie"] = ({ abrasifs: "Abrasifs", soudure: "Soudure", epi: "EPI", consommables: "Consommables" } as const)[source];
      const stockActuel = numberOrZero(row.quantite_disponible);
      const seuil = row.seuil_minimum === null ? null : numberOrZero(row.seuil_minimum);
      return {
        id: `${source}:${row.id}`,
        source,
        categorie,
        famille: text(row.famille_catalogue_snapshot) || categorie,
        referenceKey: String(row.id),
        libelle: text(row.designation_snapshot) || categorie,
        stockActuel,
        seuil,
        unite: "unites",
        statut: calculateStockAlertStatus(stockActuel, seuil),
      } satisfies StockAlertReference;
    });
}

export function createStockAlertsSnapshot(input: StockAlertSnapshotInput) {
  const articlesCatalogue = input.articlesCatalogue ?? [];
  const thresholds = new Map(
    input.seuilsLongueur.map((threshold) => [
      `${threshold.source}:${threshold.reference_key}`,
      numberOrZero(threshold.seuil_mm),
    ]),
  );

  const references = [
    ...buildLengthAlerts({
      rows: input.tubes,
      source: "tubes",
      categorie: "Tubes",
      thresholds,
      keyFor: buildTubeReferenceKey,
      familyFor: (row) => humanise(text(row.matiere)),
      labelFor: (row) => [humanise(text(row.type)), text(row.section), row.epaisseur ? `${text(row.epaisseur)} mm` : "", text(row.nuance)].filter(Boolean).join(" · "),
    }),
    ...buildLengthAlerts({
      rows: input.tigesFiletees,
      source: "tiges_filetees",
      categorie: "Tiges filetées",
      thresholds,
      keyFor: buildTigeReferenceKey,
      familyFor: (row) => humanise(text(row.matiere)),
      labelFor: (row) => `${humanise(text(row.matiere))} · ${text(row.diametre)}`,
    }),
    ...buildBoxAlerts({ rows: input.vis, source: "vis", famille: "Vis" }),
    ...buildBoxAlerts({ rows: input.ecrous, source: "ecrous", famille: "Écrous" }),
    ...buildBoxAlerts({ rows: input.rivets, source: "rivets", famille: "Rivets" }),
    ...buildQuantityAlerts({ rows: input.inserts, source: "inserts", categorie: "Fixations", famille: "Inserts" }),
    ...buildQuantityAlerts({ rows: input.forets, source: "forets", categorie: "Outillage", famille: "Forets" }),
    ...buildQuantityAlerts({ rows: input.fraises, source: "fraises", categorie: "Outillage", famille: "Fraises" }),
    ...buildQuantityAlerts({ rows: input.tarauds, source: "tarauds", categorie: "Outillage", famille: "Tarauds" }),
    ...buildCatalogueArticleAlerts(articlesCatalogue),
  ];

  const alertes = references
    .filter((reference) => reference.statut === "a_recommander" || reference.statut === "rupture")
    .sort((left, right) => severity[right.statut] - severity[left.statut] || left.libelle.localeCompare(right.libelle, "fr"));

  return {
    references,
    alertes,
    parFamille: groupStockAlertsBy(references, (reference) => `${reference.categorie}:${reference.famille}`),
    parCategorie: groupStockAlertsBy(references, (reference) => reference.categorie),
    global: getStockAlertGroup(references),
    referencesAInitialiser: articlesCatalogue.filter((article) => article.etat_initialisation === "a_initialiser").length,
    referencesCatalogueParType: Object.fromEntries(
      ["abrasifs", "soudure", "epi", "consommables"].map((type) => [
        type,
        articlesCatalogue.filter((article) => article.stock_type === type).length,
      ]),
    ) as Record<StockArticleCatalogueRow["stock_type"], number>,
  };
}
