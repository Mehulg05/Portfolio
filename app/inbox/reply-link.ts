import type { Message } from "@/lib/db/messages";

const SUBJECT = "Re: your message on mehulgupta.me";
// Some mail clients and OS handlers silently drop mailto: URLs past ~2000 characters.
const MAX_URL_LENGTH = 1800;
const TRUNCATION_LINE = "> […]";

function quote(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => (line ? `> ${line}` : ">"))
    .join("\n");
}

/**
 * A mailto: link with the subject filled in and the original message quoted below two
 * blank lines, so the reply starts at the cursor. The quote is cut until the whole URL
 * fits MAX_URL_LENGTH.
 */
export function buildReplyHref(message: Pick<Message, "email" | "name" | "message">, sentOn: string) {
  // Encoded so a crafted address cannot smuggle in its own ?cc= or &body=; @ is restored
  // because a few clients refuse %40 in the address part.
  const to = encodeURIComponent(message.email).replace(/%40/g, "@");
  const head = `mailto:${to}?subject=${encodeURIComponent(SUBJECT)}&body=`;
  const attribution = `On ${sentOn}, ${message.name} wrote:`;

  const bodyFor = (quoted: string, truncated: boolean) =>
    encodeURIComponent(
      `\n\n${attribution}\n${quote(quoted)}${truncated ? `\n${TRUNCATION_LINE}` : ""}`,
    );

  const full = bodyFor(message.message, false);
  if (head.length + full.length <= MAX_URL_LENGTH) return head + full;

  // Sliced by code point: cutting a surrogate pair in half would make encodeURIComponent throw.
  const chars = Array.from(message.message);
  const fits = (n: number) =>
    head.length + bodyFor(chars.slice(0, n).join("").trimEnd(), true).length <= MAX_URL_LENGTH;

  // Largest prefix that fits. Encoded length grows with n, so a binary search holds.
  let low = 0;
  let high = chars.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (fits(mid)) low = mid;
    else high = mid - 1;
  }
  return head + bodyFor(chars.slice(0, low).join("").trimEnd(), true);
}
