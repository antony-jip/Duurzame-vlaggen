import { NextResponse } from "next/server";

import { getAdminUser } from "@/app/admin/auth";
import { getOrderById, getOrderItems } from "@/lib/orders/repository";
import { generateMateriaalpaspoort } from "@/lib/materiaalpaspoort/generate";

/**
 * Admin-only: (her)genereer en download het materiaalpaspoort voor een order.
 *
 * Gated op de ADMIN_EMAILS-allowlist (zelfde poort als /admin). Genereert de PDF
 * on-the-fly uit de actuele order + regels — verstuurt géén e-mail, is dus veilig
 * meerdere keren aan te roepen (herdownload/controle).
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
  const pdf = await generateMateriaalpaspoort(order, items);

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="materiaalpaspoort-${order.order_number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
