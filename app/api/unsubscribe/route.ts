/**
 * RFC 8058 one-click unsubscribe endpoint. Mail clients POST here (from the
 * List-Unsubscribe header) without rendering anything; the signed token in the
 * query identifies the address. Humans use the /uitschrijven/[token] page.
 */

import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { verifyEmailToken } from "@/lib/email/links";
import { suppressEmail } from "@/lib/orders/repository";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const email = verifyEmailToken(token, serverEnv.emailLinkSecret);
  if (!email) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  await suppressEmail(email, "unsubscribe_one_click");
  return NextResponse.json({ ok: true });
}
