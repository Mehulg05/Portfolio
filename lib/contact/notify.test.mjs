import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { buildNotification, resendEndpoint, sendNotification } from "./notify.ts";

const input = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Hello, I would like to talk about a role.",
  to: "owner@example.com",
  inboxUrl: "https://mehulgupta.me/inbox",
};

const realFetch = globalThis.fetch;
const realKey = process.env.RESEND_API_KEY;
const realInfo = console.info;
const realError = console.error;

beforeEach(() => {
  // The functions log on purpose; keep the test output readable.
  console.info = () => {};
  console.error = () => {};
});

afterEach(() => {
  globalThis.fetch = realFetch;
  if (realKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = realKey;
  console.info = realInfo;
  console.error = realError;
});

function stubFetch(respond) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return respond();
  };
  return calls;
}

test("builds the Resend payload", () => {
  const { url, payload } = buildNotification(input);
  assert.equal(url, resendEndpoint);
  assert.equal(url, "https://api.resend.com/emails");
  assert.deepEqual(Object.keys(payload).sort(), ["from", "reply_to", "subject", "text", "to"]);
  assert.equal(payload.from, "Portfolio contact <onboarding@resend.dev>");
  assert.deepEqual(payload.to, ["owner@example.com"]);
  assert.equal(payload.subject, "New message from Ada Lovelace · mehulgupta.me");
});

test("reply_to is the sender, so replying answers them", () => {
  assert.equal(buildNotification(input).payload.reply_to, "ada@example.com");
});

test("the text body carries name, email, message and the inbox link", () => {
  const { text } = buildNotification(input).payload;
  assert.match(text, /Name: Ada Lovelace/);
  assert.match(text, /Email: ada@example\.com/);
  assert.ok(text.includes(input.message));
  assert.ok(text.includes("https://mehulgupta.me/inbox"));
});

test("line breaks are stripped from the name in the subject", () => {
  const { subject, text } = buildNotification({ ...input, name: "Ada\r\nBcc: victim@example.com\n" }).payload;
  assert.equal(subject, "New message from Ada Bcc: victim@example.com · mehulgupta.me");
  assert.ok(!/[\r\n]/.test(subject));
  // The body is plain text and keeps what was sent.
  assert.ok(text.includes("Ada\r\nBcc"));
});

test("without RESEND_API_KEY it is a no-op that returns false", async () => {
  delete process.env.RESEND_API_KEY;
  const calls = stubFetch(() => new Response("{}", { status: 200 }));
  assert.equal(await sendNotification(input), false);
  assert.equal(calls.length, 0);
});

test("with a key it posts the payload and returns true on success", async () => {
  process.env.RESEND_API_KEY = "re_test_key";
  const calls = stubFetch(() => new Response('{"id":"1"}', { status: 200 }));
  assert.equal(await sendNotification(input), true);
  assert.equal(calls.length, 1);
  const [{ url, init }] = calls;
  assert.equal(url, resendEndpoint);
  assert.equal(init.method, "POST");
  assert.equal(init.headers.Authorization, "Bearer re_test_key");
  assert.equal(init.headers["Content-Type"], "application/json");
  assert.ok(init.signal instanceof AbortSignal);
  assert.deepEqual(JSON.parse(init.body), buildNotification(input).payload);
});

test("returns false when Resend rejects the request", async () => {
  process.env.RESEND_API_KEY = "re_test_key";
  stubFetch(() => new Response('{"message":"invalid"}', { status: 422 }));
  assert.equal(await sendNotification(input), false);
});

test("returns false instead of throwing when fetch fails", async () => {
  process.env.RESEND_API_KEY = "re_test_key";
  globalThis.fetch = async () => {
    throw new TypeError("network down");
  };
  assert.equal(await sendNotification(input), false);
});
