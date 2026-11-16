import "server-only";
import { isIpHashConfigured } from "@/lib/contact/abuse";
import { isDatabaseConfigured } from "@/lib/db/client";

/**
 * Whether POST /api/contact can accept a message on this deployment. The contact section
 * renders the form only when this is true and the route answers 503 when it is false, so
 * the two can never disagree about whether the form works.
 */
export function isContactConfigured() {
  return isDatabaseConfigured() && isIpHashConfigured();
}
