/*
  Content-Security-Policy builders, pure so they are unit-tested. Nothing on the site loads
  from a third party, so every source is 'self'.

  The panel is rendered per request, so its scripts carry a nonce and 'strict-dynamic'
  trusts what they load. The public site is prerendered: a nonce cannot be baked into
  static HTML, and Next's own inline hydration and theme scripts need 'unsafe-inline' there.
  The rest of the policy (no frames, no plugins, no foreign forms, no <base> tricks, no
  foreign network targets) still holds.
*/

const shared = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
];

// Style attributes cannot carry a nonce; inline styles are low risk next to scripts.
const styles = "style-src 'self' 'unsafe-inline'";

export function publicCsp() {
  return [...shared, "script-src 'self' 'unsafe-inline'", styles].join("; ");
}

export function adminCsp(nonce: string) {
  return [...shared, `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`, styles].join("; ");
}

/** A fresh, unguessable nonce per request. */
export function newNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}
