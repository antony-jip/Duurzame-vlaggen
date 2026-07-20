import { NextResponse } from "next/server";

import { getOrderById, getOrderItems } from "@/lib/orders/repository";
import { generateFactuur } from "@/lib/factuur/generate";

export const runtime = "nodejs";

/**
 * Factuur-PDF bij de orderbevestiging, voor de klant zelf.
 *
 * Toegangsmodel = dat van de bevestigingspagina: het onraadbare order-UUID in
 * de URL is de sleutel (de klant krijgt die link na het afrekenen en in zijn
 * mail). Geen login vereist, net als de pagina zelf; wie de link heeft, mag de
 * factuur zien. Ingelogde klanten hebben daarnaast hun eigen route
 * (/api/account/factuur/[id]).
 *
 * Standaard `inline` zodat de browser-viewer hem toont (preview mét
 * downloadknop); `?download=1` forceert een echte download.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Order niet gevonden" }, { status: 404 });
  }
  // Zonder prijs-snapshot valt er niets te factureren (bv. een kale cart-rij).
  if (order.total == null) {
    return NextResponse.json(
      { error: "Voor deze bestelling is nog geen factuur beschikbaar." },
      { status: 409 },
    );
  }

  const items = await getOrderItems(order.id);
  const pdf = await generateFactuur(order, items);

  const download = new URL(req.url).searchParams.get("download") === "1";
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="factuur-${order.order_number}.pdf"`,
      // Bevat naam, adres en bedragen: nooit in een gedeelde cache.
      "Cache-Control": "private, no-store",
    },
  });
}
