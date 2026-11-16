import { test } from "node:test";
import assert from "node:assert/strict";
import { contentTypeIs, hostnameOf, parseJsonSafe, readBodyLimited } from "./request.ts";

const post = (body, headers = {}) => new Request("https://example.test/", { method: "POST", body, headers });

test("contentTypeIs ignores parameters and case", () => {
  assert.equal(contentTypeIs(post("{}", { "content-type": "Application/JSON; charset=utf-8" }), "application/json"), true);
  assert.equal(contentTypeIs(post("x", { "content-type": "text/plain" }), "application/json", "text/plain"), true);
  assert.equal(contentTypeIs(post("x", { "content-type": "text/html" }), "application/json"), false);
  assert.equal(contentTypeIs(post("x"), "application/json"), false);
});

test("readBodyLimited returns small bodies and null for large ones", async () => {
  assert.equal(await readBodyLimited(post("hello"), 100), "hello");
  assert.equal(await readBodyLimited(post("x".repeat(101)), 100), null);
  assert.equal(await readBodyLimited(post("x".repeat(100)), 100), "x".repeat(100));
});

test("readBodyLimited stops a chunked upload that declares no length", async () => {
  const stream = new ReadableStream({
    pull(controller) {
      controller.enqueue(new TextEncoder().encode("x".repeat(40)));
    },
  });
  const request = new Request("https://example.test/", { method: "POST", body: stream, duplex: "half" });
  assert.equal(await readBodyLimited(request, 100), null);
});

test("parseJsonSafe never throws", () => {
  assert.deepEqual(parseJsonSafe('{"a":1}'), { ok: true, value: { a: 1 } });
  assert.deepEqual(parseJsonSafe("{nope"), { ok: false });
});

test("hostnameOf drops the port and handles bracketed IPv6", () => {
  assert.equal(hostnameOf("Admin.Example.com:3000"), "admin.example.com");
  assert.equal(hostnameOf("[::1]:3000"), "::1");
  assert.equal(hostnameOf(null), "");
});
