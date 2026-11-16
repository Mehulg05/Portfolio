/*
  The email half of the contact form: a heads-up that a row landed in the inbox. The row
  is the source of truth, so every failure here is logged and swallowed, never thrown.

  Plain fetch instead of the Resend SDK: one POST does not need a dependency. This file is
  unit-tested with Node's native type stripping, so it has no imports at all; the recipient
  and the inbox URL arrive as parameters and the route resolves their defaults.
*/

export const resendEndpoint = "https://api.resend.com/emails";

// Resend's shared sender works without a verified domain. It only delivers to the address
// that owns the Resend account, so CONTACT_TO_EMAIL must be that address until a domain is verified.
const sender = "Portfolio contact <onboarding@resend.dev>";

const timeoutMs = 5000;

export type NotificationInput = {
  name: string;
  email: string;
  message: string;
  /** Who receives the notification. */
  to: string;
  /** Absolute URL of the inbox page, linked from the email body. */
  inboxUrl: string;
};

export type ResendEmail = {
  from: string;
  to: string[];
  subject: string;
  text: string;
  reply_to: string;
};

export type Notification = { url: string; payload: ResendEmail };

/*
  Resend takes JSON, so a newline in the name cannot actually inject a header. Stripping
  line breaks anyway keeps the subject on one line and the code safe if the transport changes.
*/
function singleLine(value: string) {
  return value.replace(/[\r\n\u2028\u2029]+/g, " ").trim();
}

/** Pure: builds the request without the API key, so tests never need the network. */
export function buildNotification({ name, email, message, to, inboxUrl }: NotificationInput): Notification {
  const text = [
    "New message from the portfolio contact form.",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    "",
    message,
    "",
    `Reply to this email to answer, or manage it in the inbox: ${inboxUrl}`,
  ].join("\n");

  return {
    url: resendEndpoint,
    payload: {
      from: sender,
      to: [to],
      subject: `New message from ${singleLine(name)} · mehulgupta.me`,
      text,
      // Replying from a mail client goes straight to the sender, not to onboarding@resend.dev.
      reply_to: email,
    },
  };
}

/**
 * Sends the notification. Returns true only when Resend accepted it; the caller marks the
 * row as notified on true. Without RESEND_API_KEY this is a no-op that returns false.
 */
export async function sendNotification(input: NotificationInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info("contact: RESEND_API_KEY is not set, skipping the email notification.");
    return false;
  }

  const { url, payload } = buildNotification(input);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.ok) return true;
    // Resend's error body says what was wrong (bad key, unverified recipient); the message itself is not logged.
    const detail = await response.text().catch(() => "");
    console.error(`contact: Resend answered ${response.status}.`, detail.slice(0, 500));
    return false;
  } catch (error) {
    console.error("contact: email notification failed.", error);
    return false;
  }
}
