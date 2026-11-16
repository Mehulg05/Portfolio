import { test } from "node:test";
import assert from "node:assert/strict";
import { pulseLimits, validatePulse } from "./validate.ts";

const viewId = "3f6c1a52-9b7e-4d1a-8c2f-0e5b7a9d4c11";

const view = { kind: "view", viewId, path: "/", referrerHost: "news.example.com", screen: "phone" };
const leave = {
  kind: "leave",
  viewId,
  seconds: 42,
  maxScrollPct: 80,
  sections: ["top", "experience"],
  resumeClicked: false,
  mailtoClicked: true,
};

function checkView(overrides) {
  return validatePulse({ ...view, ...overrides });
}

function checkLeave(overrides) {
  return validatePulse({ ...leave, ...overrides });
}

function assertRejected(result) {
  assert.deepEqual(result, { ok: false });
}

test("accepts a valid view and a valid leave unchanged", () => {
  assert.deepEqual(validatePulse(view), { ok: true, value: view });
  assert.deepEqual(validatePulse(leave), { ok: true, value: leave });
});

test("rejects non-objects and unknown kinds", () => {
  for (const body of [null, undefined, "view", 42, [view], { ...view, kind: "click" }, { ...view, kind: undefined }]) {
    assertRejected(validatePulse(body));
  }
});

test("view id must be a UUID and is lowercased", () => {
  assertRejected(checkView({ viewId: "not-a-uuid" }));
  assertRejected(checkView({ viewId: `${viewId}0` }));
  assertRejected(checkView({ viewId: 12 }));
  assertRejected(checkView({ viewId: "3f6c1a52-9b7e-4d1a-8c2f-0e5b7a9d4c1g" }));
  const upper = checkView({ viewId: viewId.toUpperCase() });
  assert.equal(upper.ok && upper.value.viewId, viewId);
});

test("path must start with a slash, fit the limit and carry no control characters", () => {
  assertRejected(checkView({ path: "" }));
  assertRejected(checkView({ path: "about" }));
  assertRejected(checkView({ path: "https://example.com/" }));
  assertRejected(checkView({ path: `/${"a".repeat(pulseLimits.pathMax)}` }));
  assertRejected(checkView({ path: "/a\nb" }));
  assertRejected(checkView({ path: "/a\u0000b" }));
  assertRejected(checkView({ path: "/a\u2028b" }));
  assertRejected(checkView({ path: 5 }));
  const longest = checkView({ path: `/${"a".repeat(pulseLimits.pathMax - 1)}` });
  assert.equal(longest.ok, true);
});

test("path loses its query and hash", () => {
  const result = checkView({ path: "/work?utm_source=x#contact" });
  assert.equal(result.ok && result.value.path, "/work");
  const hashOnly = checkView({ path: "/#top" });
  assert.equal(hashOnly.ok && hashOnly.value.path, "/");
});

test("referrer host is null or hostname-shaped, lowercased", () => {
  assert.equal(checkView({ referrerHost: null }).ok, true);
  const mixed = checkView({ referrerHost: "News.Example.COM" });
  assert.equal(mixed.ok && mixed.value.referrerHost, "news.example.com");
  assert.equal(checkView({ referrerHost: "xn--bcher-kva.example" }).ok, true);
  assert.equal(checkView({ referrerHost: "localhost" }).ok, true);
  for (const bad of [undefined, "", "example.com/path", "a b.com", "-bad.com", "bad-.com", "a..com", "[::1]", 7]) {
    assertRejected(checkView({ referrerHost: bad }));
  }
  assertRejected(checkView({ referrerHost: `${"a".repeat(64)}.com` }));
  assertRejected(checkView({ referrerHost: `${"abc.".repeat(64)}com` }));
});

test("screen is phone or desktop", () => {
  assert.equal(checkView({ screen: "desktop" }).ok, true);
  for (const bad of ["tablet", "PHONE", null, undefined]) assertRejected(checkView({ screen: bad }));
});

test("seconds is a non-negative integer, clamped to a day", () => {
  assert.equal(checkLeave({ seconds: 0 }).ok, true);
  const clamped = checkLeave({ seconds: 10 * pulseLimits.secondsMax });
  assert.equal(clamped.ok && clamped.value.seconds, pulseLimits.secondsMax);
  for (const bad of [-1, 1.5, "10", null, Number.NaN, Number.POSITIVE_INFINITY]) {
    assertRejected(checkLeave({ seconds: bad }));
  }
});

test("max scroll is an integer percentage", () => {
  assert.equal(checkLeave({ maxScrollPct: 0 }).ok, true);
  assert.equal(checkLeave({ maxScrollPct: 100 }).ok, true);
  for (const bad of [-1, 101, 50.5, "50", null]) assertRejected(checkLeave({ maxScrollPct: bad }));
});

test("sections are slug-shaped, bounded and deduped in order", () => {
  const result = checkLeave({ sections: ["top", "contact", "top", "client-work", "contact"] });
  assert.deepEqual(result.ok && result.value.sections, ["top", "contact", "client-work"]);
  assert.equal(checkLeave({ sections: [] }).ok, true);

  const thirty = Array.from({ length: pulseLimits.sectionsMax }, (_, index) => `s${index}`);
  assert.equal(checkLeave({ sections: thirty }).ok, true);
  assertRejected(checkLeave({ sections: [...thirty, "one-more"] }));
  // Duplicates do not count toward the limit.
  assert.equal(checkLeave({ sections: [...thirty, "s0"] }).ok, true);

  for (const bad of [["Top"], ["has space"], ["-lead"], [""], [1], ["a".repeat(61)], "top", null]) {
    assertRejected(checkLeave({ sections: bad }));
  }
});

test("click flags must be real booleans", () => {
  for (const bad of ["true", 1, 0, null, undefined]) {
    assertRejected(checkLeave({ resumeClicked: bad }));
    assertRejected(checkLeave({ mailtoClicked: bad }));
  }
});

test("extra keys are ignored rather than echoed", () => {
  const result = validatePulse({ ...view, extra: "x", seconds: 5 });
  assert.deepEqual(result, { ok: true, value: view });
});
