import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, accessIsConfigured, createAccessSession, readAccessSession, roleForCode } from "@/lib/access";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = readAccessSession(request.cookies.get(ACCESS_COOKIE)?.value);
  return NextResponse.json({ configured: accessIsConfigured(), role: session?.role ?? null });
}

export async function POST(request: NextRequest) {
  if (!accessIsConfigured()) {
    return NextResponse.json({ message: "Les codes d'accès ne sont pas encore configurés." }, { status: 503 });
  }

  const input = await request.json().catch(() => null) as { code?: unknown } | null;
  const code = typeof input?.code === "string" ? input.code.trim() : "";
  const role = roleForCode(code);
  if (!role) return NextResponse.json({ message: "Code d'accès incorrect." }, { status: 401 });

  const response = NextResponse.json({ success: true, role });
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: createAccessSession(role),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({ name: ACCESS_COOKIE, value: "", path: "/", maxAge: 0 });
  return response;
}
