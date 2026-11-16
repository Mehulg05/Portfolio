import type { MessageView } from "@/lib/db/messages";

export const viewLabels: Record<MessageView, string> = {
  inbox: "Inbox",
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};
