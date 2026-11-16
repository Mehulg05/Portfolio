import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeCursor, encodeCursor, isMessageStatus, isMessageView, isUuid, normaliseSearch, MAX_SEARCH_LENGTH } from "./messages-model.ts";

const id = "0b3b1c2e-5d6f-4a7b-8c9d-0e1f2a3b4c5d";
const time = "2026-11-17T08:30:15.123456Z";

test("a cursor round-trips with microsecond precision and a lowercased id", () => {
  assert.deepEqual(decodeCursor(encodeCursor(time, id.toUpperCase())), { time, id });
});

test("malformed cursors decode to null instead of throwing", () => {
  const bad = [
    "",
    null,
    undefined,
    "not base64 !",
    "a".repeat(129),
    encodeCursor("2026-11-17T08:30:15.123Z", id),
    encodeCursor(time, "not-a-uuid"),
    encodeCursor("2026-13-45T08:30:15.123456Z", id),
    encodeCursor("2026-02-30T08:30:15.123456Z", id),
    Buffer.from(`${time}|${id}|extra`).toString("base64url"),
  ];
  for (const cursor of bad) assert.equal(decodeCursor(cursor), null, String(cursor));
});

test("status, view and uuid guards", () => {
  assert.equal(isMessageStatus("replied"), true);
  assert.equal(isMessageStatus("inbox"), false);
  assert.equal(isMessageView("inbox"), true);
  assert.equal(isMessageView(undefined), false);
  assert.equal(isUuid(id), true);
  assert.equal(isUuid(`${id}x`), false);
  assert.equal(isUuid(1), false);
});

test("search terms are trimmed and capped", () => {
  assert.equal(normaliseSearch("  hello "), "hello");
  assert.equal(normaliseSearch("x".repeat(MAX_SEARCH_LENGTH + 50)).length, MAX_SEARCH_LENGTH);
  assert.equal(normaliseSearch(["a"]), "");
});
