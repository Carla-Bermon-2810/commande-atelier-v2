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
  quantite: number;
}

interface CartContextType {
  cart: CartItem[];

  totalItems: number;

  addToCart: (item: CartItem) => void;

  removeFromCart: (article: string) => void;

  increaseQuantity: (article: string) => void;

  decreaseQuantity: (article: string) => void;

  updateQuantity: (article: string, quantite: number) => void;

  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.article === "string" &&
    typeof item.famille === "string" &&
    typeof item.quantite === "number" &&
    Number.isInteger(item.quantite) &&
    item.quantite > 0 &&
    (item.photo === undefined || typeof item.photo === "string") &&
    (item.catalogueId === undefined || (typeof item.catalogueId === "number" && Number.isSafeInteger(item.catalogueId) && item.catalogueId > 0)) &&
    (item.variante === undefined || typeof item.variante === "string")
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
        (a) => a.article === item.article
      );

      if (exist) {
        return oldCart.map((a) =>
          a.article === item.article
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

  function increaseQuantity(article: string) {
    setCart((oldCart) =>
      oldCart.map((a) =>
        a.article === article
          ? {
              ...a,
              quantite: Math.min(10_000, a.quantite + 1),
            }
          : a
      )
    );
  }

  function decreaseQuantity(article: string) {
    setCart((oldCart) =>
      oldCart
        .map((a) =>
          a.article === article
            ? {
                ...a,
                quantite: a.quantite - 1,
              }
            : a
        )
        .filter((a) => a.quantite > 0)
    );
  }
  
  function updateQuantity(article: string, quantite: number) {
    setCart((oldCart) =>
      oldCart.map((a) =>
        a.article === article
          ? {
              ...a,
              quantite: Math.min(10_000, Math.max(1, quantite)),
            }
          : a
      )
    );
  }
  
  function removeFromCart(article: string) {
    setCart((oldCart) =>
      oldCart.filter((a) => a.article !== article)
    );
  }

  function clearCart() {
    setCart([]);
  }

  const totalItems = cart.reduce(
    (total, item) => total + item.quantite,
    0
  );

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
