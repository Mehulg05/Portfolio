import { parseMessagesParams } from "@/app/admin/messages/url";
import { messageCsvFilename, messageCsvHeader, messageCsvRow } from "@/lib/admin/csv";
import { hasAdminSession } from "@/lib/admin/auth";
import { isDatabaseConfigured } from "@/lib/db/client";
import { type MessagePage, type MessagePageQuery, listMessagesPage } from "@/lib/db/messages";
import { OWNER_TIME_ZONE } from "@/lib/db/retention";
import { errorClass } from "@/lib/http/error";
import { textResponse as text } from "@/lib/http/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_SIZE = 500;

function encodePage(page: MessagePage) {
  return page.items.map(messageCsvRow).join("");
}

/*
  GET /api/admin/messages/export?status=&q= : the same filter as the list, as CSV.
  Streamed in keyset batches so memory stays flat however large the table grows. The first
  batch is read before the response starts, so a database failure is a clean 500 instead
  of a truncated download.
*/
export async function GET(request: Request) {
  if (!(await hasAdminSession())) return text("Sign in first.", 401);
  if (!isDatabaseConfigured()) return text("DATABASE_URL is not set.", 503);

  const { status, q } = parseMessagesParams(Object.fromEntries(new URL(request.url).searchParams));
  const query: MessagePageQuery = { status, q, limit: BATCH_SIZE };

  let firstPage: MessagePage;
  try {
    firstPage = await listMessagesPage(query);
  } catch (error) {
    console.error("[messages] export failed", errorClass(error));
    return text("Could not read messages.", 500);
  }

  const encoder = new TextEncoder();
  let cursor = firstPage.nextCursor;
  let started = false;

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (!started) {
        started = true;
        controller.enqueue(encoder.encode(messageCsvHeader() + encodePage(firstPage)));
        if (!cursor) controller.close();
        return;
      }
      if (!cursor) return controller.close();
      try {
        const page = await listMessagesPage({ ...query, cursor });
        cursor = page.nextCursor;
        controller.enqueue(encoder.encode(encodePage(page)));
        if (!cursor) controller.close();
      } catch (error) {
        console.error("[messages] export stream failed", errorClass(error));
        controller.error(error);
      }
    },
  });

  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${messageCsvFilename(new Date(), OWNER_TIME_ZONE)}"`,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
