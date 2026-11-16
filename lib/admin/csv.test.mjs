import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CSV_BOM,
  csvCell,
  csvRow,
  messageCsvColumns,
  messageCsvFilename,
  messageCsvHeader,
  messageCsvRow,
} from "./csv.ts";

test("plain values pass through unquoted", () => {
  assert.equal(csvCell("Ada Lovelace"), "Ada Lovelace");
  assert.equal(csvCell("ada@example.com"), "ada@example.com");
  assert.equal(csvCell(42), "42");
});

test("null and undefined become empty fields", () => {
  assert.equal(csvCell(null), "");
  assert.equal(csvCell(undefined), "");
  assert.equal(csvRow([null, "a", undefined]), ",a,\r\n");
});

test("dates are written as ISO 8601 in UTC", () => {
  assert.equal(csvCell(new Date("2026-11-16T05:30:00.000Z")), "2026-11-16T05:30:00.000Z");
});

test("commas, quotes and line breaks are quoted per RFC 4180", () => {
  assert.equal(csvCell("a,b"), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell("line one\nline two"), '"line one\nline two"');
  assert.equal(csvCell("crlf\r\nhere"), '"crlf\r\nhere"');
});

test("formula-like strings are prefixed with an apostrophe", () => {
  for (const start of ["=", "+", "-", "@", "\t", "\r"]) {
    const cell = csvCell(`${start}HYPERLINK("http://evil.example")`);
    const unquoted = cell.startsWith('"') ? cell.slice(1) : cell;
    assert.ok(unquoted.startsWith(`'${start}`), `guarded ${JSON.stringify(start)}: ${cell}`);
  }
  assert.equal(csvCell("=1+1"), "'=1+1");
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell("\rcmd"), `"'\rcmd"`);
});

test("only a leading metacharacter triggers the guard", () => {
  assert.equal(csvCell("a=b"), "a=b");
  assert.equal(csvCell("x-y@z"), "x-y@z");
  assert.equal(csvCell(" =1"), " =1");
});

test("numbers we produce are not mangled by the guard", () => {
  assert.equal(csvCell(-3), "-3");
});

test("rows end with CRLF and keep field order", () => {
  assert.equal(csvRow(["a", "b,c", "d"]), 'a,"b,c",d\r\n');
});

test("the header starts with a BOM and lists the export columns in order", () => {
  const header = messageCsvHeader();
  assert.ok(header.startsWith(CSV_BOM));
  assert.equal(header, `${CSV_BOM}${messageCsvColumns.join(",")}\r\n`);
  assert.deepEqual(
    [...messageCsvColumns],
    ["id", "created_at", "status", "name", "email", "message", "read_at", "replied_at", "archived_at"],
  );
});

test("a message row maps every column, guarding sender-controlled fields", () => {
  const row = messageCsvRow({
    id: "3f0c3c9e-8b1a-4c1e-9d55-3a1f2b9c0d11",
    createdAt: new Date("2026-11-16T05:30:00.123Z"),
    status: "replied",
    name: "@Mallory",
    email: "mallory@example.com",
    message: "-2+3\nsecond line, with comma",
    readAt: new Date("2026-11-16T06:00:00.000Z"),
    repliedAt: null,
    archivedAt: null,
  });
  assert.equal(
    row,
    "3f0c3c9e-8b1a-4c1e-9d55-3a1f2b9c0d11,2026-11-16T05:30:00.123Z,replied,'@Mallory,mallory@example.com," +
      `"'-2+3\nsecond line, with comma",2026-11-16T06:00:00.000Z,,\r\n`,
  );
});

test("the filename is dated in the given time zone", () => {
  // 20:00 UTC on the 16th is already the 17th in India.
  const now = new Date("2026-11-16T20:00:00.000Z");
  assert.equal(messageCsvFilename(now, "Asia/Kolkata"), "messages-2026-11-17.csv");
  assert.equal(messageCsvFilename(now, "UTC"), "messages-2026-11-16.csv");
});
