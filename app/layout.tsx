import type { Metadata } from "next";
import { CartProvider } from "@/context/cart-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Commande Atelier | Découpe Laser",
  description: "Catalogue et commandes internes de l'atelier Découpe Laser.",
  icons: { icon: "/d%C3%A9coupe%20laser%20logo%20PNG%202023.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
