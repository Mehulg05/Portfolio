import { type NextRequest, NextResponse } from "next/server";
import { adminHost, isAdminHost } from "@/lib/admin/host";
import { adminCsp, newNonce, publicCsp } from "@/lib/http/csp";

/*
  One deployment, two hosts. The admin host maps its clean URLs (/, /messages, /pulse,
  /health) onto app/admin/**, and the public host never serves admin pages: old /inbox
  links and stray /admin paths are sent to the admin host instead.

  This is also where the Content-Security-Policy is set (the other security headers are
  static, in next.config.ts), because the panel's policy carries a per-request nonce.
  CSP is skipped in development: React's dev tooling needs eval and an HMR socket.
*/

const noindex = "noindex, nofollow";
const enforceCsp = process.env.NODE_ENV === "production";

// Generated metadata routes (favicon, social cards) are served as they are on both hosts.
const METADATA_PATHS = new Set(["/icon", "/apple-icon", "/opengraph-image", "/twitter-image", "/sitemap.xml"]);

function adminRobots() {
  return new NextResponse("User-agent: *\nDisallow: /\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": noindex },
  });
}

function rewriteToAdmin(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/robots.txt") return adminRobots();

  // Next reads the nonce from the request's CSP header and stamps it on its own scripts.
  const nonce = newNonce();
  const csp = adminCsp(nonce);
  const headers = new Headers(request.headers);
  if (enforceCsp) headers.set("Content-Security-Policy", csp);

  // APIs and metadata routes keep their real paths; everything else is a panel page under /admin.
  const keepPath =
    pathname.startsWith("/api/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    METADATA_PATHS.has(pathname);
  const response = keepPath
    ? NextResponse.next({ request: { headers } })
    : NextResponse.rewrite(new URL(`/admin${pathname === "/" ? "" : pathname}${request.nextUrl.search}`, request.url), {
        request: { headers },
      });
  response.headers.set("X-Robots-Tag", noindex);
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  if (enforceCsp) response.headers.set("Content-Security-Policy", csp);
  return response;
}

/*
  Temporary (307), not permanent: browsers cache a 308 for good, and the admin host should
  be live and stable before anything is cached against it. Switch to 308 once it is.
*/
function redirectToAdmin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.hostname = adminHost;
  url.pathname = url.pathname.replace(/^\/(inbox|admin)/, "") || "/";
  if (url.pathname === "/" && request.nextUrl.pathname.startsWith("/inbox")) url.pathname = "/messages";
  return NextResponse.redirect(url, 307);
}

export function proxy(request: NextRequest) {
  if (isAdminHost(request.headers.get("host"))) return rewriteToAdmin(request);

  const { pathname } = request.nextUrl;
  if (/^\/(inbox|admin)(\/|$)/.test(pathname)) return redirectToAdmin(request);
  // Admin APIs answer only on the admin host, where the session cookie lives.
  if (pathname.startsWith("/api/admin/")) return new NextResponse("Not found", { status: 404 });

  const response = NextResponse.next();
  if (enforceCsp) response.headers.set("Content-Security-Policy", publicCsp());
  return response;
}

export const config = {
  matcher: [
    // Static assets and Next internals never need host routing...
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|avif|mp4|webm|pdf|ico|woff2?)$).*)",
    // ...except that an extension must not smuggle an admin route past the host check
    // (/api/admin/messages/<id>.png would otherwise reach its handler on the public host).
    "/api/admin/:path*",
    "/admin/:path*",
    "/inbox/:path*",
  ],
};
