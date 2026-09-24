import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, accessIsConfigured, readAccessSession } from "@/lib/access";

function redirectToAccess(request: NextRequest) {
  const url = new URL("/acces", request.url);
  url.searchParams.set("suivant", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/acces" || pathname.startsWith("/api/access")) return NextResponse.next();

  const needsAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!needsAdmin) return NextResponse.next();
  if (!accessIsConfigured()) {
    return pathname.startsWith("/api/")
      ? NextResponse.json({ message: "Accès administrateur non configuré." }, { status: 503 })
      : redirectToAccess(request);
  }
  const session = readAccessSession(request.cookies.get(ACCESS_COOKIE)?.value);
  if (!session || session.role !== "admin") return pathname.startsWith("/api/")
    ? NextResponse.json({ message: "Accès administrateur requis." }, { status: 401 })
    : redirectToAccess(request);

  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
