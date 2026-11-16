import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LOGIN_FAILURE_LIMIT,
  LOGIN_WINDOW_SECONDS,
  OTP_MAX_ATTEMPTS,
  OTP_REQUEST_LIMIT,
  OTP_TTL_SECONDS,
  buildCodeEmail,
  codeMatches,
  generateCode,
  hashCode,
  isLockedOut,
  isRedeemable,
} from "./otp-core.ts";

const key = "k".repeat(32);
const now = new Date("2026-01-01T12:00:00Z");
const fresh = (over = {}) => ({
  codeHash: hashCode("123456", key),
  expiresAt: new Date(now.getTime() + OTP_TTL_SECONDS * 1000),
  attempts: 0,
  usedAt: null,
  ...over,
});

test("codes are six digits, zero padded, and vary", () => {
  const codes = Array.from({ length: 200 }, generateCode);
  assert.ok(codes.every((c) => /^\d{6}$/.test(c)));
  assert.ok(new Set(codes).size > 150);
});

test("the hash is keyed, deterministic and never contains the code", () => {
  const hash = hashCode("123456", key);
  assert.equal(hash, hashCode("123456", key));
  assert.notEqual(hash, hashCode("123456", "z".repeat(32)));
  assert.ok(!hash.includes("123456"));
  assert.match(hash, /^[0-9a-f]{64}$/);
});

test("the right code matches; wrong, malformed and empty ones do not", () => {
  const { codeHash } = fresh();
  assert.equal(codeMatches("123456", codeHash, key), true);
  assert.equal(codeMatches("123457", codeHash, key), false);
  assert.equal(codeMatches("12345", codeHash, key), false);
  assert.equal(codeMatches("1234567", codeHash, key), false);
  assert.equal(codeMatches("12345a", codeHash, key), false);
  assert.equal(codeMatches("", codeHash, key), false);
  assert.equal(codeMatches("123456", codeHash, "z".repeat(32)), false);
});

test("expiry is exclusive at the deadline", () => {
  assert.equal(isRedeemable(fresh(), now), true);
  const expiresAt = new Date(now.getTime() + 1000);
  assert.equal(isRedeemable(fresh({ expiresAt }), new Date(now.getTime() + 999)), true);
  assert.equal(isRedeemable(fresh({ expiresAt }), new Date(now.getTime() + 1000)), false);
});

test("a used code cannot be redeemed again", () => {
  assert.equal(isRedeemable(fresh({ usedAt: now }), now), false);
});

test("a code dies after its attempt budget", () => {
  assert.equal(isRedeemable(fresh({ attempts: OTP_MAX_ATTEMPTS - 1 }), now), true);
  assert.equal(isRedeemable(fresh({ attempts: OTP_MAX_ATTEMPTS }), now), false);
});

test("sign-in throttle is 15 failures per minute; code requests 3 per 10 minutes", () => {
  assert.equal(LOGIN_FAILURE_LIMIT, 15);
  assert.equal(LOGIN_WINDOW_SECONDS, 60);
  assert.equal(isLockedOut(14), false);
  assert.equal(isLockedOut(15), true);
  assert.equal(OTP_REQUEST_LIMIT, 3);
});

test("the email goes to the given address only and states the expiry", () => {
  const email = buildCodeEmail("042917", "owner@example.com", "admin.example.com");
  assert.deepEqual(email.to, ["owner@example.com"]);
  assert.match(email.subject, /042917/);
  assert.match(email.text, /10 minutes/);
});
