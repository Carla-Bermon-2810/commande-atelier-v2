import CartButton from "./CartButton";

export default function Header() {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold">Commande Atelier</h1>

        <p className="text-gray-500">
          Commande de consommables
        </p>
      </div>

      <CartButton />
    </header>
  );
}