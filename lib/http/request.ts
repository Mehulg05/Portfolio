/*
  Request parsing shared by every route that takes a body. No imports, so Node's native
  type stripping can unit-test it.
*/

/** True when the Content-Type, ignoring parameters such as charset, is one of `types`. */
export function contentTypeIs(request: Request, ...types: string[]) {
  const type = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
  return types.includes(type);
}

/**
 * The body as text, or null when it is larger than `maxBytes`. Reads the stream itself and
 * stops at the limit, because a chunked upload has no Content-Length and request.text()
 * would buffer all of it.
 */
export async function readBodyLimited(request: Request, maxBytes: number) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export type JsonParse = { ok: true; value: unknown } | { ok: false };

export function parseJsonSafe(text: string): JsonParse {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

/** A form body, or null when it is missing or malformed. */
export async function readFormSafe(request: Request) {
  try {
    return await request.formData();
  } catch {
    return null;
  }
}

/** The hostname of a Host header, lowercased, port dropped; bracketed IPv6 hosts are handled. */
export function hostnameOf(hostHeader: string | null) {
  const host = hostHeader?.trim().toLowerCase() ?? "";
  if (host.startsWith("[")) return host.slice(1, Math.max(1, host.indexOf("]")));
  return host.split(":")[0] ?? "";
}
