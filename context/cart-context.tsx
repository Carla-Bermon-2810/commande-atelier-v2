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
  quantite: number;
}

interface CartContextType {
  cart: CartItem[];

  totalItems: number;

  addToCart: (item: CartItem) => void;

  removeFromCart: (article: string) => void;

  increaseQuantity: (article: string) => void;

  decreaseQuantity: (article: string) => void;

  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Chargement depuis le navigateur
  useEffect(() => {
    const saved = localStorage.getItem("atelier-cart");

    if (saved) {
      setCart(JSON.parse(saved));
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
                quantite: a.quantite + item.quantite,
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
              quantite: a.quantite + 1,
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