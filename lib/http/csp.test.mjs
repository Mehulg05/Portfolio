import { test } from "node:test";
import assert from "node:assert/strict";
import { adminCsp, newNonce, publicCsp } from "./csp.ts";

test("nonces are unique per call", () => {
  assert.notEqual(newNonce(), newNonce());
  assert.match(newNonce(), /^[A-Za-z0-9+/]{22}==$/);
});

test("the admin policy trusts scripts by nonce only and forbids framing", () => {
  const csp = adminCsp("abc123");
  assert.match(csp, /script-src 'self' 'nonce-abc123' 'strict-dynamic'/);
  assert.doesNotMatch(csp.split("; ").find((part) => part.startsWith("script-src")), /unsafe-inline/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
});

test("both policies keep everything on this origin", () => {
  for (const csp of [publicCsp(), adminCsp("n")]) {
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /connect-src 'self'/);
    assert.match(csp, /form-action 'self'/);
    assert.match(csp, /base-uri 'none'/);
    assert.doesNotMatch(csp, /https?:\/\//);
  }
});
