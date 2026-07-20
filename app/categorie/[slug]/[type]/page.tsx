interface PageProps {
  params: Promise<{
    slug: string;
    type: string;
  }>;
}

export default async function TypePage({ params }: PageProps) {
  const { slug, type } = await params;

  return (
    <main className="p-10">
      <h1>Test</h1>

      <p>Slug : {slug}</p>

      <p>Type : {decodeURIComponent(type)}</p>
    </main>
  );
}