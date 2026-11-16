import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminHeader } from "@/app/admin/_ui/AdminHeader";
import { NotConfigured } from "@/app/admin/_ui/NotConfigured";
import { SignIn } from "@/app/admin/_ui/SignIn";
import { ADMIN_SESSION_MAX_AGE_SECONDS, getAdminSession, isAdminConfigured } from "@/lib/admin/auth";
import { adminHost } from "@/lib/admin/host";
import { LOGIN_FAILURE_LIMIT, LOGIN_WINDOW_SECONDS } from "@/lib/admin/login-attempts";
import { countUnreadMessages } from "@/lib/admin/unread";
import { isIpHashConfigured } from "@/lib/contact/abuse";
import { isDatabaseConfigured } from "@/lib/db/client";

// Reads the session cookie on every request; no admin route may be cached or prerendered.
export const dynamic = "force-dynamic";

/*
  The whole panel is gated here. Signed out, the sign-in sheet replaces `children`
  entirely, so a page's markup never reaches an unauthenticated response (pages also
  bail out early so they do not query for nothing).
*/

function missingConfig() {
  return [
    isAdminConfigured() ? null : "INBOX_SECRET",
    isDatabaseConfigured() ? null : "DATABASE_URL",
    // Without it the sign-in throttle has no key; production refuses to guess one.
    isIpHashConfigured() ? null : "IP_HASH_SALT",
  ].filter((name) => name !== null);
}

export async function generateMetadata(): Promise<Metadata> {
  // Only a signed-in request may learn the count, even through the tab title.
  const unread = missingConfig().length === 0 && (await getAdminSession()) ? await countUnreadMessages() : null;
  const prefix = unread ? `(${unread}) ` : "";

  return {
    title: { template: `${prefix}%s · Admin`, default: `${prefix}Admin` },
    robots: { index: false, follow: false },
    // The root layout points canonical at the portfolio home; that is wrong for every admin page.
    alternates: { canonical: null },
  };
}

function Gate({ children }: { children: ReactNode }) {
  return (
    <main id="top" className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
      {children}
    </main>
  );
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const missing = missingConfig();
  if (missing.length > 0) {
    return (
      <Gate>
        <NotConfigured missing={missing} />
      </Gate>
    );
  }

  const session = await getAdminSession();
  if (!session) {
    return (
      <Gate>
        <SignIn
          host={adminHost}
          sessionDays={ADMIN_SESSION_MAX_AGE_SECONDS / 86_400}
          failureLimit={LOGIN_FAILURE_LIMIT}
          windowMinutes={LOGIN_WINDOW_SECONDS / 60}
        />
      </Gate>
    );
  }

  const unread = await countUnreadMessages();
  return (
    <>
      <AdminHeader sessionExpiresAt={session.expiresAt} now={new Date()} unread={unread} />
      <main id="top" className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
        {children}
      </main>
    </>
  );
}
