import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

// Redirect de UX (apenas presenca do cookie — a validacao real e feita nas rotas/API).
// Next 16: o antigo "middleware" agora se chama "proxy".
export function proxy(req: NextRequest) {
  const hasCookie = !!req.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (!hasCookie && !isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (hasCookie && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/feed";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/feed", "/new-case", "/queue", "/condutas", "/pending", "/case/:path*", "/login", "/register"],
};
