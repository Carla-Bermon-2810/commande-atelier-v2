type Filter = { column: "id" | "categorie" | "famille" | "slug"; value: string | number | boolean | null };
type AdminTable = "catalogue" | "categories" | "famille";

export async function adminData<T>(table: AdminTable, operation: "select" | "insert" | "update" | "delete", options: { values?: Record<string, unknown>; filters?: Filter[]; order?: string } = {}) {
  const response = await fetch("/api/admin/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table, operation, ...options }) });
  const result = await response.json() as { data?: T; message?: string };
  if (!response.ok) throw new Error(result.message ?? "Opération d'administration impossible.");
  return result.data as T;
}
