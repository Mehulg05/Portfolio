import { test } from "node:test";
import assert from "node:assert/strict";
import { contactLimits } from "./types.ts";
import { isHoneypotFilled, validateContact } from "./validate.ts";

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Hello, I would like to talk about a role.",
  website: "",
  elapsedMs: 12_000,
};

function check(overrides) {
  return validateContact({ ...valid, ...overrides }, contactLimits);
}

function assertFails(result, field) {
  assert.equal(result.ok, false);
  assert.equal(result.field, field);
  assert.equal(typeof result.message, "string");
  assert.ok(result.message.length > 0);
  assert.ok(!result.message.includes("\u2014"), "copy must not contain an em-dash");
}

test("accepts a valid submission unchanged", () => {
  const result = check({});
  assert.deepEqual(result, { ok: true, value: valid });
});

test("trims every text field", () => {
  const result = check({
    name: "  Ada  ",
    email: "\tada@example.com\n",
    message: "   Hello there, friend.   ",
    website: "  ",
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.name, "Ada");
  assert.equal(result.value.email, "ada@example.com");
  assert.equal(result.value.message, "Hello there, friend.");
  assert.equal(result.value.website, "");
});

test("name bounds are checked after trimming", () => {
  assertFails(check({ name: "" }), "name");
  assertFails(check({ name: "    " }), "name");
  assert.equal(check({ name: "A" }).ok, true);
  assert.equal(check({ name: "a".repeat(contactLimits.name.max) }).ok, true);
  assertFails(check({ name: "a".repeat(contactLimits.name.max + 1) }), "name");
  assert.equal(check({ name: ` ${"a".repeat(contactLimits.name.max)} ` }).ok, true);
});

test("email must look like an address", () => {
  for (const email of ["", "ada", "ada@", "@example.com", "ada@example", "ada @example.com", "ada@ex ample.com", "a@b@c.com"]) {
    assertFails(check({ email }), "email");
  }
  for (const email of ["ada@example.com", "a.b+tag@sub.example.co.uk", "x@y.z"]) {
    assert.equal(check({ email }).ok, true, email);
  }
});

test("email length is capped", () => {
  const domain = "@example.com";
  const atMax = "a".repeat(contactLimits.email.max - domain.length) + domain;
  assert.equal(check({ email: atMax }).ok, true);
  assertFails(check({ email: `a${atMax}` }), "email");
});

test("message bounds are checked after trimming", () => {
  assertFails(check({ message: "" }), "message");
  assertFails(check({ message: "short" }), "message");
  assertFails(check({ message: `  ${"a".repeat(contactLimits.message.min - 1)}  ` }), "message");
  assert.equal(check({ message: "a".repeat(contactLimits.message.min) }).ok, true);
  assert.equal(check({ message: "a".repeat(contactLimits.message.max) }).ok, true);
  assertFails(check({ message: "a".repeat(contactLimits.message.max + 1) }), "message");
});

test("non-string fields are rejected, not coerced", () => {
  assertFails(check({ name: 42 }), "name");
  assertFails(check({ name: ["Ada"] }), "name");
  assertFails(check({ email: { address: "ada@example.com" } }), "email");
  assertFails(check({ message: null }), "message");
  assertFails(check({ message: undefined }), "message");
});

test("reports the first failing field in form order", () => {
  assertFails(check({ name: "", email: "bad", message: "" }), "name");
  assertFails(check({ email: "bad", message: "" }), "email");
});

test("a body that is not an object fails like an empty form", () => {
  for (const body of [null, undefined, "text", 7, true, [valid]]) {
    assertFails(validateContact(body, contactLimits), "name");
  }
});

test("the honeypot passes through for the route to act on", () => {
  assert.equal(check({ website: "https://spam.example" }).value.website, "https://spam.example");
  assert.equal(check({ website: undefined }).value.website, "");
  assert.equal(check({ website: null }).value.website, "");
  // A bot that sends a non-string still trips it.
  assert.notEqual(check({ website: 1 }).value.website, "");
});

test("elapsedMs is kept when it is a finite, non-negative number, null otherwise", () => {
  assert.equal(check({ elapsedMs: 123 }).value.elapsedMs, 123);
  for (const elapsedMs of [undefined, null, "4000", -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const result = check({ elapsedMs });
    assert.equal(result.ok, true);
    assert.equal(result.value.elapsedMs, null);
  }
});

test("a name with a line break or other control character is rejected", () => {
  for (const name of ["Bob\nEmail: x@evil.com", "Bob\r\nX", "Bob X", "Bob\u0000"]) {
    assertFails(check({ name }), "name");
  }
});

test("NUL is rejected in the email and the message, newlines in the message are kept", () => {
  assertFails(check({ email: "a\u0000@example.com" }), "email");
  assertFails(check({ message: "hello there\u0000friend" }), "message");
  assert.equal(check({ message: "line one\nline two" }).ok, true);
});

test("the honeypot is detected before any field is validated", () => {
  assert.equal(isHoneypotFilled({ website: "http://spam", name: "", email: "bad" }), true);
  assert.equal(isHoneypotFilled({ website: "" }), false);
  assert.equal(isHoneypotFilled({}), false);
  assert.equal(isHoneypotFilled(null), false);
});
