import { NextResponse } from "next/server";

import {
  getKlantDocumentOrder,
  WEIGERING_MELDING,
  WEIGERING_STATUS,
} from "@/lib/orders/klant-documenten";
import { generateMateriaalpaspoort } from "@/lib/materiaalpaspoort/generate";

export const runtime = "nodejs";

/**
 * Het materiaalpaspoort van je eigen bestelling, voor de ingelogde klant.
 *
 * Ging tot nu toe alleen als bijlage bij de betaalmail mee. Die mail raakt kwijt
 * of komt niet aan; het paspoort is juist het document dat een klant maanden
 * later nodig heeft voor zijn duurzaamheidsverslag. Vandaar ook hier, uit dezelfde
 * generator, zodat er nooit twee versies van hetzelfde paspoort bestaan.
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

  const pdf = await generateMateriaalpaspoort(res.order, res.items);

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="materiaalpaspoort-${res.order.order_number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
