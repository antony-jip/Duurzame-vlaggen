import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { runBetaalherinnering } from "@/lib/orders/betaalherinnering";

/**
 * Dagelijkse betaalherinnering-scan (cron, zie vercel.json): op-rekening-orders
 * die 7 dagen na plaatsing nog niet betaald zijn, krijgen één herinnering met
 * de betaallink. Eenmaligheid via orders.payment_reminder_sent_at.
 *
 * Vercel roept dit aan met `Authorization: Bearer $CRON_SECRET` (zelfde
 * patroon als /api/cron/lifecycle). Zonder geldige secret: 401 — anders zou
 * iedereen mailruns kunnen triggeren.
 */
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, fout: "CRON_SECRET niet ingesteld op de server." },
      { status: 500 },
    );
  }

  const header = request.headers.get("authorization");
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, fout: "Niet geautoriseerd." }, { status: 401 });
  }

  try {
    const result = await runBetaalherinnering();
    console.info("[cron/betaalherinnering] run:", JSON.stringify(result));
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    // Geen stacktrace terug: dit endpoint is publiek bereikbaar.
    const bericht = e instanceof Error ? e.message : String(e);
    console.error("[cron/betaalherinnering] mislukt:", bericht);
    return NextResponse.json({ ok: false, fout: bericht }, { status: 500 });
  }
}
