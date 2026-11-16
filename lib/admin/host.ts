import { siteUrl } from "@/lib/site";

/*
  The admin panel lives on its own host (admin.mehulgupta.me), so its cookie is scoped to
  that host by default and the public site never carries it. Locally, set
  ADMIN_HOST=admin.localhost: Chromium resolves *.localhost to loopback.
*/
export const adminHost = (process.env.ADMIN_HOST || "admin.mehulgupta.me").toLowerCase();

function hostnameOf(hostHeader: string | null) {
  return hostHeader?.split(":")[0]?.trim().toLowerCase() ?? "";
}

export function isAdminHost(hostHeader: string | null) {
  return hostnameOf(hostHeader) === adminHost;
}

/** An absolute admin URL that keeps the public site's protocol and port (https in production, the dev port locally). */
export function adminUrl(path: string) {
  const url = new URL(path, siteUrl);
  url.hostname = adminHost;
  return url.toString();
}

/** Origin of the admin host, as the browser sends it in the Origin header. */
export function adminOrigin() {
  return new URL(adminUrl("/")).origin;
}
