import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="relative w-full max-w-2xl">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        size={20}
      />

      <input
        type="text"
        placeholder="Rechercher un article..."
        className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}