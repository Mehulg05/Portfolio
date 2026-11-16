import { type NextRequest, NextResponse } from "next/server";
import { adminHost, isAdminHost } from "@/lib/admin/host";

/*
  One deployment, two hosts. The admin host maps its clean URLs (/, /messages, /pulse,
  /health) onto app/admin/**, and the public host never serves admin pages: old /inbox
  links and stray /admin paths are sent to the admin host instead.
*/

const noindex = "noindex, nofollow";

function adminRobots() {
  return new NextResponse("User-agent: *\nDisallow: /\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": noindex },
  });
}

function rewriteToAdmin(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/robots.txt") return adminRobots();

  // APIs keep their real paths; everything else is a panel page under /admin.
  const isApi = pathname.startsWith("/api/");
  const alreadyAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const response =
    isApi || alreadyAdmin
      ? NextResponse.next()
      : NextResponse.rewrite(new URL(`/admin${pathname === "/" ? "" : pathname}${request.nextUrl.search}`, request.url));
  response.headers.set("X-Robots-Tag", noindex);
  return response;
}

function redirectToAdmin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.hostname = adminHost;
  url.pathname = url.pathname.replace(/^\/(inbox|admin)/, "") || "/";
  if (url.pathname === "/" && request.nextUrl.pathname.startsWith("/inbox")) url.pathname = "/messages";
  return NextResponse.redirect(url, 308);
}

export function proxy(request: NextRequest) {
  if (isAdminHost(request.headers.get("host"))) return rewriteToAdmin(request);

  const { pathname } = request.nextUrl;
  if (/^\/(inbox|admin)(\/|$)/.test(pathname)) return redirectToAdmin(request);
  // Admin APIs answer only on the admin host, where the session cookie lives.
  if (pathname.startsWith("/api/admin/")) return new NextResponse("Not found", { status: 404 });
  return NextResponse.next();
}

export const config = {
  // Static assets and Next internals never need host routing.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|avif|mp4|webm|pdf|ico|woff2?)$).*)"],
};
