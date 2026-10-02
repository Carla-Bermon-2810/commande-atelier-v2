"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface CartItem {
  article: string;
  famille: string;
  photo?: string;
  /** Lien optionnel conservé sur les futures lignes de commande. */
  catalogueId?: number;
  /** Libellé de variante conservé comme snapshot lorsque disponible. */
  variante?: string;
  /** Libellé commercial lisible conservé au moment de la commande. */
  unite?: string;
  /** Référence métier facultative, affichée uniquement lorsqu'elle aide l'atelier. */
  referenceMetier?: string;
  /** Identité exacte d'une référence ajoutée depuis le Stock. */
  stockReference?: {
    source: "tubes" | "tiges_filetees" | "vis" | "ecrous" | "inserts" | "rivets" | "forets" | "fraises" | "tarauds" | "abrasifs" | "soudure" | "epi" | "consommables";
    referenceId?: number;
    referenceKey?: string;
    uniteCommande: "piece" | "boite" | "barre" | "unite";
    uniteStock: "pieces" | "mm" | "unites";
    facteurConversion: number;
    longueurParBarreMm?: number;
    configuration?: Record<string, string | number | null>;
  };
  quantite: number;
}

/**
 * Une ligne de panier catalogue est identifiée par sa variante réelle. Les
 * demandes anciennes ou hors catalogue restent identifiées par leur libellé.
 */
export function cartItemKey(item: Pick<CartItem, "article" | "catalogueId" | "variante" | "stockReference">) {
  if (item.stockReference) {
    const stock = item.stockReference;
    const identity = typeof stock.referenceId === "number" ? String(stock.referenceId) : stock.referenceKey?.trim().toLocaleLowerCase("fr") ?? "";
    const configuration = Object.entries(stock.configuration ?? {})
      .sort(([left], [right]) => left.localeCompare(right, "fr"))
      .map(([key, value]) => `${key}:${String(value ?? "")}`)
      .join("|");
    return `stock-${stock.source}-${identity}-${stock.uniteCommande}-${stock.facteurConversion}-${stock.longueurParBarreMm ?? ""}-${item.variante?.trim().toLocaleLowerCase("fr") ?? ""}-${configuration}`;
  }
  if (typeof item.catalogueId === "number" && Number.isSafeInteger(item.catalogueId) && item.catalogueId > 0) {
    return `catalogue-${item.catalogueId}`;
  }

  return `libre-${item.article.trim().toLocaleLowerCase("fr")}-${item.variante?.trim().toLocaleLowerCase("fr") ?? ""}`;
}

interface CartContextType {
  cart: CartItem[];

  totalItems: number;

  addToCart: (item: CartItem) => void;

  removeFromCart: (item: CartItem) => void;

  increaseQuantity: (item: CartItem) => void;

  decreaseQuantity: (item: CartItem) => void;

  updateQuantity: (item: CartItem, quantite: number) => void;

  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;
  const stockReference = item.stockReference as Record<string, unknown> | undefined;

  return (
    typeof item.article === "string" &&
    typeof item.famille === "string" &&
    typeof item.quantite === "number" &&
    Number.isInteger(item.quantite) &&
    item.quantite > 0 &&
    (item.photo === undefined || typeof item.photo === "string") &&
    (item.catalogueId === undefined || (typeof item.catalogueId === "number" && Number.isSafeInteger(item.catalogueId) && item.catalogueId > 0)) &&
    (item.variante === undefined || typeof item.variante === "string") &&
    (item.unite === undefined || typeof item.unite === "string") &&
    (item.referenceMetier === undefined || typeof item.referenceMetier === "string") &&
    (item.stockReference === undefined || (
      typeof stockReference === "object" && stockReference !== null &&
      typeof stockReference.source === "string" &&
      (["tubes", "tiges_filetees", "vis", "ecrous", "inserts", "rivets", "forets", "fraises", "tarauds", "abrasifs", "soudure", "epi", "consommables"] as string[]).includes(stockReference.source) &&
      (["piece", "boite", "barre", "unite"] as string[]).includes(String(stockReference.uniteCommande)) &&
      (["pieces", "mm", "unites"] as string[]).includes(String(stockReference.uniteStock)) &&
      typeof stockReference.facteurConversion === "number" && Number.isFinite(stockReference.facteurConversion) && stockReference.facteurConversion > 0 &&
      (stockReference.referenceId === undefined || (typeof stockReference.referenceId === "number" && Number.isSafeInteger(stockReference.referenceId) && stockReference.referenceId > 0)) &&
      (stockReference.referenceKey === undefined || typeof stockReference.referenceKey === "string") &&
      (stockReference.longueurParBarreMm === undefined || (typeof stockReference.longueurParBarreMm === "number" && Number.isFinite(stockReference.longueurParBarreMm) && stockReference.longueurParBarreMm > 0)) &&
      (stockReference.configuration === undefined || (typeof stockReference.configuration === "object" && stockReference.configuration !== null && !Array.isArray(stockReference.configuration) && Object.values(stockReference.configuration as Record<string, unknown>).every((value) => value === null || typeof value === "string" || (typeof value === "number" && Number.isFinite(value)))))
    ))
  );
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Chargement depuis le navigateur
  useEffect(() => {
    const saved = localStorage.getItem("atelier-cart");

    if (!saved) return;

    try {
      const parsed: unknown = JSON.parse(saved);

      if (Array.isArray(parsed) && parsed.every(isCartItem)) {
        // Le panier est volontairement restauré après hydratation pour éviter
        // une divergence entre le rendu serveur et le navigateur.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCart(parsed);
      } else {
        localStorage.removeItem("atelier-cart");
      }
    } catch {
      localStorage.removeItem("atelier-cart");
    }
  }, []);

  // Sauvegarde automatique
  useEffect(() => {
    localStorage.setItem(
      "atelier-cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  function addToCart(item: CartItem) {
    setCart((oldCart) => {
      const exist = oldCart.find(
        (a) => cartItemKey(a) === cartItemKey(item)
      );

      if (exist) {
        return oldCart.map((a) =>
          cartItemKey(a) === cartItemKey(item)
            ? {
                ...a,
                quantite: Math.min(10_000, a.quantite + item.quantite),
              }
            : a
        );
      }

      return [...oldCart, item];
    });
  }

  function increaseQuantity(item: CartItem) {
    setCart((oldCart) =>
      oldCart.map((a) =>
        cartItemKey(a) === cartItemKey(item)
          ? {
              ...a,
              quantite: Math.min(10_000, a.quantite + 1),
            }
          : a
      )
    );
  }

  function decreaseQuantity(item: CartItem) {
    setCart((oldCart) =>
      oldCart
        .map((a) =>
            cartItemKey(a) === cartItemKey(item)
            ? {
                ...a,
                quantite: a.quantite - 1,
              }
            : a
        )
        .filter((a) => a.quantite > 0)
    );
  }
  
  function updateQuantity(item: CartItem, quantite: number) {
    setCart((oldCart) =>
      oldCart.map((a) =>
        cartItemKey(a) === cartItemKey(item)
          ? {
              ...a,
              quantite: Math.min(10_000, Math.max(1, quantite)),
            }
          : a
      )
    );
  }
  
  function removeFromCart(item: CartItem) {
    setCart((oldCart) =>
      oldCart.filter((a) => cartItemKey(a) !== cartItemKey(item))
    );
  }

  function clearCart() {
    setCart([]);
  }

  // Le compteur global représente les références différentes, jamais une
  // addition d'unités hétérogènes (boîtes, pièces, barres, etc.).
  const totalItems = cart.length;

  return (
    <CartContext.Provider
      value={{
        cart,
        totalItems,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart doit être utilisé dans CartProvider"
    );
  }

  return context;
}
