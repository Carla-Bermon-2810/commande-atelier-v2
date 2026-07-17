import Link from "next/link";

interface Props {
  icon: string;
  title: string;
  href: string;
}

export default function CategoryCard({ icon, title, href }: Props) {
  return (
    <Link
      href={href}
      className="flex h-40 flex-col items-center justify-center rounded-2xl border bg-white shadow-md transition duration-200 hover:-translate-y-1 hover:border-blue-500 hover:shadow-xl"
    >
      <span className="text-5xl">{icon}</span>

      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
    </Link>
  );
}