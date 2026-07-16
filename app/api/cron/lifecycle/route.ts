import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { runLifecycle } from "@/lib/orders/lifecycle";

/**
 * Dagelijkse lifecycle-scan (cron, zie vercel.json): vervangingsmails op 4 en
 * 8 maanden na verzending, met dedupe via order_events en de
 * marketing_suppressions-opt-outlijst.
 *
 * Vercel roept dit aan met `Authorization: Bearer $CRON_SECRET` (zelfde
 * patroon als /api/cron/gsc-snapshot). Zonder geldige secret: 401 — anders zou
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
    const results = await runLifecycle();
    console.info("[cron/lifecycle] run:", JSON.stringify(results));
    return NextResponse.json({ ok: true, results });
  } catch (e) {
    // Geen stacktrace terug: dit endpoint is publiek bereikbaar.
    const bericht = e instanceof Error ? e.message : String(e);
    console.error("[cron/lifecycle] mislukt:", bericht);
    return NextResponse.json({ ok: false, fout: bericht }, { status: 500 });
  }
}
