import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp, networkOf } from "./ip.ts";

const request = (headers) => new Request("https://example.test/", { headers });

test("IPv4 addresses are kept as they are", () => {
  assert.equal(networkOf("203.0.113.9"), "203.0.113.9");
  assert.equal(networkOf("unknown"), "unknown");
});

test("IPv6 addresses collapse to their /64, however they are written", () => {
  const expected = "2001:db8:abcd:12::/64";
  assert.equal(networkOf("2001:db8:abcd:12:1:2:3:4"), expected);
  assert.equal(networkOf("2001:0DB8:abcd:0012::7"), expected);
  assert.equal(networkOf("2001:db8:abcd:12::"), expected);
});

test("an abbreviated IPv6 address expands before it is cut", () => {
  assert.equal(networkOf("::1"), "0:0:0:0::/64");
  assert.equal(networkOf("2001:db8::1"), "2001:db8:0:0::/64");
});

test("IPv4-mapped IPv6 is left alone", () => {
  assert.equal(networkOf("::ffff:203.0.113.9"), "::ffff:203.0.113.9");
});

test("on Vercel the platform headers beat a client-supplied x-forwarded-for", () => {
  const spoofed = request({ "x-forwarded-for": "6.6.6.6", "x-vercel-forwarded-for": "198.51.100.4" });
  assert.equal(clientIp(spoofed, true), "198.51.100.4");
  assert.equal(clientIp(request({ "x-forwarded-for": "6.6.6.6", "x-real-ip": "198.51.100.5" }), true), "198.51.100.5");
});

test("off Vercel x-forwarded-for's first entry is used, then x-real-ip", () => {
  assert.equal(clientIp(request({ "x-forwarded-for": "198.51.100.7, 10.0.0.1" }), false), "198.51.100.7");
  assert.equal(clientIp(request({ "x-real-ip": "198.51.100.8" }), false), "198.51.100.8");
  assert.equal(clientIp(request({}), false), "unknown");
});
