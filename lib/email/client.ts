import "server-only";
import { Resend } from "resend";

import { serverEnv } from "@/lib/env";

/**
 * Resend-client, lui geïnstantieerd.
 *
 * E-mail is OPTIONEEL: als `RESEND_API_KEY` ontbreekt (bijv. lokaal), geeft dit
 * `null` terug zodat de aanroeper de verzending netjes kan overslaan i.p.v. te
 * crashen. Zo blijft de order-flow altijd werken, ook zonder mailconfig.
 */
let cached: Resend | null | undefined;

export function getResendClient(): Resend | null {
  if (cached !== undefined) return cached;
  const key = serverEnv.resendApiKey;
  cached = key ? new Resend(key) : null;
  return cached;
}

/** True wanneer e-mail verstuurd kan worden (API-key aanwezig). */
export function isEmailConfigured(): boolean {
  return serverEnv.resendApiKey !== null;
}
