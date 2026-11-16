import { test } from "node:test";
import assert from "node:assert/strict";
import { SESSION_LIFETIME_MS, createSessionValue, isIssuedAfter, verifySessionValue } from "./session-core.ts";

const secret = "a".repeat(32);
const now = 1_800_000_000_000;

test("a fresh session verifies and reports its claims", () => {
  const claims = verifySessionValue(secret, createSessionValue(secret, now), now + 1000);
  assert.deepEqual(claims, { issuedAt: now, expiresAt: now + SESSION_LIFETIME_MS });
});

test("a session is rejected at and after its expiry", () => {
  const value = createSessionValue(secret, now);
  assert.ok(verifySessionValue(secret, value, now + SESSION_LIFETIME_MS - 1));
  assert.equal(verifySessionValue(secret, value, now + SESSION_LIFETIME_MS), null);
});

test("a different secret does not verify", () => {
  const value = createSessionValue(secret, now);
  assert.equal(verifySessionValue("b".repeat(32), value, now), null);
});

test("changing the expiry or the issue time breaks the signature", () => {
  const [v, issued, expires, signature] = createSessionValue(secret, now).split(".");
  const farFuture = String(Number(expires) + 10 ** 9);
  assert.equal(verifySessionValue(secret, [v, issued, farFuture, signature].join("."), now), null);
  assert.equal(verifySessionValue(secret, [v, String(Number(issued) + 1), expires, signature].join("."), now), null);
});

test("the old unversioned format and other malformed values are rejected", () => {
  const sig = "0".repeat(64);
  for (const value of ["", "garbage", `${now}.${sig}`, `v2.${now}.${sig}`, `v2.-1.5.${sig}`, `v2.1.2.${"z".repeat(64)}`, `v2.${"9".repeat(16)}.1.${sig}`]) {
    assert.equal(verifySessionValue(secret, value, now), null, value);
  }
});

test("sessions issued before the revocation point are refused, later ones are not", () => {
  const claims = { issuedAt: now, expiresAt: now + SESSION_LIFETIME_MS };
  assert.equal(isIssuedAfter(claims, null), true);
  assert.equal(isIssuedAfter(claims, now - 1), true);
  assert.equal(isIssuedAfter(claims, now), true);
  assert.equal(isIssuedAfter(claims, now + 1), false);
});
