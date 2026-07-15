import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { draaiSnapshot } from "@/lib/analytics/snapshot";
import { gscGeconfigureerd } from "@/lib/analytics/gsc";

/**
 * Dagelijkse Search Console-snapshot (cron, zie vercel.json).
 *
 * Vercel roept dit aan met `Authorization: Bearer $CRON_SECRET`. Zonder geldige
 * secret: 401. De route staat in `app/robots.ts` al onder de disallow van /api,
 * maar de secret is de echte beveiliging.
 *
 * `maxDuration` omhoog: bij een volle catalogus zijn dit twee GSC-queries van
 * maximaal 25k rijen plus een reeks upserts, en dat haalt de standaardlimiet
 * niet altijd.
 */
export const maxDuration = 60;
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

  if (!gscGeconfigureerd()) {
    return NextResponse.json(
      { ok: false, fout: "Search Console niet gekoppeld (GSC_* ontbreken)." },
      { status: 500 },
    );
  }

  try {
    const resultaat = await draaiSnapshot();
    return NextResponse.json({ ok: true, ...resultaat });
  } catch (e) {
    // Geen stacktrace terug: dit endpoint is publiek bereikbaar.
    const bericht = e instanceof Error ? e.message : String(e);
    console.error("[cron/gsc-snapshot] mislukt:", bericht);
    return NextResponse.json({ ok: false, fout: bericht }, { status: 500 });
  }
}
