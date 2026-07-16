"use server";

import { redirect } from "next/navigation";
import { serverEnv } from "@/lib/env";
import { verifyEmailToken } from "@/lib/email/links";
import { suppressEmail } from "@/lib/orders/repository";

/** Confirmed unsubscribe from the /uitschrijven/[token] page. */
export async function confirmUnsubscribeAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const email = verifyEmailToken(token, serverEnv.emailLinkSecret);
  if (!email) return;
  await suppressEmail(email, "unsubscribe");
  redirect(`/uitschrijven/${encodeURIComponent(token)}?done=1`);
}
