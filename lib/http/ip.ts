/*
  Who is calling, as a rate-limit key. No imports, so it is unit-tested directly.
*/

/**
 * Every limiter keys on this, so an IPv6 address is cut to its /64: a single client usually
 * controls the whole /64 and could otherwise take a fresh bucket per address.
 */
export function networkOf(ip: string) {
  if (!ip.includes(":") || ip.includes(".")) return ip;
  const [head = "", tail = ""] = ip.toLowerCase().split("::");
  const front = head ? head.split(":") : [];
  const back = tail ? tail.split(":") : [];
  const groups = ip.includes("::")
    ? [...front, ...Array<string>(Math.max(0, 8 - front.length - back.length)).fill("0"), ...back]
    : front;
  return `${groups.slice(0, 4).map((group) => group.replace(/^0+(?=.)/, "")).join(":")}::/64`;
}

/*
  On Vercel, x-vercel-forwarded-for and x-real-ip are set by the platform and cannot be
  supplied by the client, so they win. Elsewhere x-forwarded-for is client-controlled; it
  is the fallback so local runs and other hosts still get a key.
*/
export function clientIp(request: Request, onVercel = Boolean(process.env.VERCEL)) {
  const header = (name: string) => request.headers.get(name)?.split(",")[0]?.trim() || undefined;
  const ip = onVercel
    ? header("x-vercel-forwarded-for") || header("x-real-ip") || header("x-forwarded-for")
    : header("x-forwarded-for") || header("x-real-ip");
  return networkOf(ip || "unknown");
}
