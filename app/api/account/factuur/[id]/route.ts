import { NextResponse } from "next/server";

import {
  getKlantDocumentOrder,
  WEIGERING_MELDING,
  WEIGERING_STATUS,
} from "@/lib/orders/klant-documenten";
import { generateFactuur } from "@/lib/factuur/generate";

export const runtime = "nodejs";

/**
 * De factuur van je eigen bestelling, voor de ingelogde klant.
 *
 * Tegenhanger van de admin-route, maar met een andere poort: de admin mag elke
 * order, een klant alleen de zijne. Die controle staat in
 * `getKlantDocumentOrder` — nooit de id uit de URL vertrouwen.
 *
 * On-the-fly uit de order-snapshot, net als bij de admin: er wordt niets
 * opgeslagen en niets gemaild, dus herhaald ophalen is ongevaarlijk.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await getKlantDocumentOrder(id);
  if (!res.ok) {
    return NextResponse.json(
      { error: WEIGERING_MELDING[res.reden] },
      { status: WEIGERING_STATUS[res.reden] },
    );
  }

  const pdf = await generateFactuur(res.order, res.items);

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="factuur-${res.order.order_number}.pdf"`,
      // Bevat naam, adres en bedragen: nooit in een gedeelde cache.
      "Cache-Control": "private, no-store",
    },
  });
}
