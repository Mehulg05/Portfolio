/*
  CSV encoding for the messages export. Pure and dependency-free so it runs under Node's
  type stripping in the unit tests: no `@/` paths, no runtime imports.

  Two concerns beyond RFC 4180 quoting:
  - Formula injection. A message is attacker-controlled text; a cell starting with = + - @
    (or tab/CR, which some spreadsheets skip before evaluating) can run as a formula when the
    file is opened. Such cells get a leading apostrophe, which spreadsheets treat as "text".
  - A UTF-8 byte order mark at the very start, without which Excel guesses a legacy code page
    and mangles any non-ASCII name.
*/

export type CsvValue = string | number | Date | null | undefined;

export const CSV_BOM = "﻿";

const FORMULA_START = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",\r\n]/;

function stringify(value: CsvValue) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/** One field: neutralised against formula injection, then quoted per RFC 4180 when needed. */
export function csvCell(value: CsvValue) {
  let text = stringify(value);
  // Numbers and dates are produced by us, never by the sender, so only strings are guarded.
  if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`;
  return NEEDS_QUOTES.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** One record terminated by CRLF, as RFC 4180 specifies. */
export function csvRow(values: readonly CsvValue[]) {
  return `${values.map(csvCell).join(",")}\r\n`;
}

export const messageCsvColumns = [
  "id",
  "created_at",
  "status",
  "name",
  "email",
  "message",
  "read_at",
  "replied_at",
  "archived_at",
] as const;

export type MessageCsvSource = {
  id: string;
  createdAt: Date;
  status: string;
  name: string;
  email: string;
  message: string;
  readAt: Date | null;
  repliedAt: Date | null;
  archivedAt: Date | null;
};

export function messageCsvHeader() {
  return CSV_BOM + csvRow(messageCsvColumns);
}

export function messageCsvRow(message: MessageCsvSource) {
  return csvRow([
    message.id,
    message.createdAt,
    message.status,
    message.name,
    message.email,
    message.message,
    message.readAt,
    message.repliedAt,
    message.archivedAt,
  ]);
}

/** `messages-YYYY-MM-DD.csv`, dated in the given zone so a late-night export is not "tomorrow". */
export function messageCsvFilename(now: Date, timeZone: string) {
  // en-CA formats dates as YYYY-MM-DD.
  const day = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    now,
  );
  return `messages-${day}.csv`;
}
