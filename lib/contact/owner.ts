import "server-only";
import { adminUrl } from "@/lib/admin/host";
import { sendNotification } from "@/lib/contact/notify";
import { profile } from "@/lib/content/profile";

/*
  The one way to tell the owner about a message: the live route and the retry path both go
  through here, so the recipient and the inbox link cannot drift apart again.
*/

export type OwnerNotice = { name: string; email: string; message: string };

export function notifyOwner(notice: OwnerNotice) {
  return sendNotification({
    ...notice,
    // An empty value left in the dashboard should fall back too, hence || over ??.
    to: process.env.CONTACT_TO_EMAIL || profile.email,
    inboxUrl: adminUrl("/messages"),
  });
}
