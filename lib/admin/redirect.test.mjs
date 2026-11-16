import { test } from "node:test";
import assert from "node:assert/strict";
import { messagesHref, safeReturnState } from "../../app/admin/messages/url.ts";

const home = { status: "inbox", q: "", cursor: null, id: null };

test("hostile return values all collapse to the plain messages view", () => {
  const hostile = [
    "//evil.example",
    "/\\evil.example",
    "https://evil.example/messages",
    "http://return.invalid/messages",
    "javascript:alert(1)",
    "/messages/../admin",
    "/messagesx",
    "/admin",
    "",
    42,
    null,
    undefined,
    `/messages?q=${"a".repeat(3000)}`,
  ];
  for (const value of hostile) assert.deepEqual(safeReturnState(value), home, String(value).slice(0, 40));
});

test("only allow-listed params survive and are rebuilt, never echoed", () => {
  const id = "0b3b1c2e-5d6f-4a7b-8c9d-0e1f2a3b4c5d";
  const state = safeReturnState(`/messages?status=archived&q=hi&id=${id}&redirect=//evil.example&notice=deleted`);
  assert.deepEqual(state, { status: "archived", q: "hi", cursor: null, id });
  assert.equal(messagesHref(state), `/messages?status=archived&q=hi&id=${id}`);
});

test("an unknown status or malformed id falls back to defaults", () => {
  assert.deepEqual(safeReturnState("/messages?status=drop&id=1"), home);
});
