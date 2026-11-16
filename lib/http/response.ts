/** The one error shape for JSON endpoints: `{ ok: false, code, message }`. */
export function jsonError(status: number, code: string, message: string, headers?: HeadersInit) {
  return Response.json({ ok: false, code, message }, { status, headers });
}

/** Plain-text answer, used by the form-posted admin routes that browsers render directly. */
export function textResponse(body: string, status: number) {
  return new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}
