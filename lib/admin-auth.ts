import { cookies } from "next/headers";
import { ACCESS_COOKIE, readAccessSession } from "@/lib/access";

export async function hasAdminAccess() {
  const cookieStore = await cookies();
  return readAccessSession(cookieStore.get(ACCESS_COOKIE)?.value)?.role === "admin";
}

export async function requireAdminAccess() {
  if (!await hasAdminAccess()) throw new Error("Accès administrateur requis.");
}
