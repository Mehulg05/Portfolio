"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Long enough that skimming past with J/K leaves messages unread, short enough to feel automatic.
const DWELL_MS = 1200;

/*
  "Opening marks it read", done as an explicit POST after the message has been on screen,
  never as a side effect of the GET that rendered it. Without JavaScript nothing changes
  and the Mark read button does the job. The route answers a form post with a 303, which
  fetch sees as an opaque redirect under redirect: "manual"; that, or any 2xx, is success.
*/
export function MarkReadOnOpen({ id }: { id: string }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch(`/api/admin/messages/${id}`, {
          method: "POST",
          body: new URLSearchParams({ status: "read" }),
          redirect: "manual",
          credentials: "same-origin",
        });
        if (response.type === "opaqueredirect" || response.ok) router.refresh();
      } catch {
        // Offline or the server is down: the message just stays new.
      }
    }, DWELL_MS);
    return () => clearTimeout(timer);
  }, [id, router]);

  return null;
}
