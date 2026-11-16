import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server.js";
import { proxy } from "../../proxy.ts";

const adminHost = "admin.mehulgupta.me";
const call = (url, host) => proxy(new NextRequest(url, { headers: { host } }));

test("the public host redirects old inbox and admin paths to the admin host, temporarily", () => {
  const inbox = call("https://mehulgupta.me/inbox", "mehulgupta.me");
  assert.equal(inbox.status, 307);
  assert.equal(inbox.headers.get("location"), `https://${adminHost}/messages`);
  const nested = call("https://mehulgupta.me/admin/pulse", "mehulgupta.me");
  assert.equal(nested.headers.get("location"), `https://${adminHost}/pulse`);
});

test("admin APIs do not exist on the public host", () => {
  assert.equal(call("https://mehulgupta.me/api/admin/session", "mehulgupta.me").status, 404);
  assert.equal(call("https://mehulgupta.me/api/admin/messages/x.png", "mehulgupta.me").status, 404);
});

test("the public site passes through", () => {
  const response = call("https://mehulgupta.me/", "mehulgupta.me");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-middleware-next"), "1");
});

test("the admin host maps clean paths onto /admin and keeps APIs and icons where they are", () => {
  const rewrite = (path) => call(`https://${adminHost}${path}`, adminHost).headers.get("x-middleware-rewrite");
  assert.equal(rewrite("/messages?id=1"), `https://${adminHost}/admin/messages?id=1`);
  assert.equal(rewrite("/"), `https://${adminHost}/admin`);
  assert.equal(rewrite("/api/admin/session"), null);
  assert.equal(rewrite("/icon"), null);
});

test("every admin response is noindex, uncached and never referred", () => {
  const response = call(`https://${adminHost}/health`, adminHost);
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
});

test("the admin host answers robots.txt itself", async () => {
  const response = call(`https://${adminHost}/robots.txt`, adminHost);
  assert.match(await response.text(), /Disallow: \//);
});
