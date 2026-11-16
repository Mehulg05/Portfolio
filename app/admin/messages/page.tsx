import type { Metadata } from "next";
import Link from "next/link";
import { InboxHeader } from "@/app/admin/messages/InboxHeader";
import { MessageList } from "@/app/admin/messages/MessageList";
import { NotConfigured } from "@/app/admin/_ui/NotConfigured";
import { SignIn } from "@/app/admin/_ui/SignIn";
import { labelStyle } from "@/app/admin/_ui/styles";
import { hasAdminSession, isAdminConfigured } from "@/lib/admin/auth";
import { isDatabaseConfigured } from "@/lib/db/client";
import { listMessages, type Message } from "@/lib/db/messages";

// Reads a cookie and live rows on every request; nothing here may be cached or prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inbox",
  robots: { index: false, follow: false },
};

const LIST_LIMIT = 200;

async function loadMessages(): Promise<Message[] | null> {
  try {
    return await listMessages(LIST_LIMIT);
  } catch (error) {
    console.error("[inbox] listing messages failed", error);
    return null;
  }
}

async function InboxContent({ failedSignIn }: { failedSignIn: boolean }) {
  const missing = [
    isAdminConfigured() ? null : "INBOX_SECRET",
    isDatabaseConfigured() ? null : "DATABASE_URL",
  ].filter((name) => name !== null);
  if (missing.length > 0) return <NotConfigured missing={missing} />;

  if (!(await hasAdminSession())) return <SignIn failed={failedSignIn} />;

  const messages = await loadMessages();
  if (!messages) {
    return (
      <p role="alert" className="border border-redline/45 bg-ground p-5 font-mono text-[12px] text-redline sm:p-7">
        Could not reach the database. Check the server logs and reload.
      </p>
    );
  }

  const now = new Date();
  return (
    <>
      <InboxHeader
        total={messages.length}
        unread={messages.filter((m) => m.status === "new").length}
        replied={messages.filter((m) => m.status === "replied").length}
        capped={messages.length === LIST_LIMIT}
      />
      <MessageList messages={messages} now={now} />
    </>
  );
}

export default async function InboxPage({ searchParams }: PageProps<"/admin/messages">) {
  const { error } = await searchParams;

  return (
    <main id="top" className="mx-auto w-full max-w-4xl flex-1 px-5 py-12 sm:px-8 sm:py-20">
      <nav aria-label="Breadcrumb" className={`${labelStyle} mb-8 sm:mb-10`}>
        <Link href="/" className="hover:text-accent">
          mehulgupta.me
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-ink-dim">
          Inbox
        </span>
      </nav>

      <InboxContent failedSignIn={error !== undefined} />

      <footer className={`${labelStyle} mt-10 border-t border-line pt-5`}>
        Stored in Postgres · rendered per request
      </footer>
    </main>
  );
}
