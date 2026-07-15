import { NextResponse } from "next/server";

import { getAdminUser } from "@/app/admin/auth";
import { getOrderById, getOrderItems } from "@/lib/orders/repository";
import { generatePakbon } from "@/lib/pakbon/generate";

/**
 * Admin-only: genereer en toon de pakbon voor een order.
 *
 * Zelfde vorm als de materiaalpaspoort-route: gated op de ADMIN_EMAILS-allowlist,
 * on-the-fly gegenereerd uit de actuele order + regels, verstuurt niets. Veilig
 * om meerdere keren aan te roepen.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Order niet gevonden" }, { status: 404 });
  }

  const items = await getOrderItems(order.id);
  const pdf = await generatePakbon(order, items);

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      // `inline`: opent in de PDF-viewer zodat je 'm kunt controleren voor je print.
      "Content-Disposition": `inline; filename="pakbon-${order.order_number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
