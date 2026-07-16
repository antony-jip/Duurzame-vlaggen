import { NextResponse } from "next/server";

import { getAdminUser } from "@/app/admin/auth";
import { getOrderById, getOrderDesigns, getOrderItems } from "@/lib/orders/repository";
import { buildZip, type ZipEntry } from "@/lib/artwork/zip";

/**
 * Admin-only: alle aangeleverde ontwerpen van een order als één ZIP.
 *
 * Zelfde vorm als de pakbon-route (gated op de ADMIN_EMAILS-allowlist). Lost
 * ook het downloadprobleem op: de losse bestanden staan cross-origin in
 * Storage (daar negeert de browser het `download`-attribuut), maar deze route
 * is same-origin en stuurt een attachment — één klik, alles binnen, klaar
 * voor de handmatige Probo-aanlevering.
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

  const [items, designs] = await Promise.all([
    getOrderItems(order.id),
    getOrderDesigns(order.id),
  ]);

  // Bestandsnaam in het archief: regel + aantal + oorspronkelijke naam, zodat
  // ook bij dubbele namen (twee keer "logo.pdf") elk bestand uniek heet en je
  // aan de naam ziet welk ontwerp op hoeveel vlaggen gaat.
  const entries: ZipEntry[] = [];
  for (const [itemIndex, item] of items.entries()) {
    const rows = designs.get(item.id) ?? [];
    const delivered = rows.filter(
      (d): d is typeof d & { file_url: string } => d.file_url !== null,
    );
    for (const [designIndex, design] of delivered.entries()) {
      const res = await fetch(design.file_url, { cache: "no-store" });
      if (!res.ok) continue; // ontbrekend object: sla over, de rest gaat door
      const data = new Uint8Array(await res.arrayBuffer());
      const naam = design.file_name ?? `ontwerp-${designIndex + 1}`;
      entries.push({
        name: `regel${itemIndex + 1}-${item.product_type}/${design.quantity}x-${naam}`,
        data,
      });
    }
    // Legacy orders van vóór de designtabel: alleen het losse regelbestand.
    if (rows.length === 0 && item.file_url) {
      const res = await fetch(item.file_url, { cache: "no-store" });
      if (res.ok) {
        entries.push({
          name: `regel${itemIndex + 1}-${item.product_type}/${decodeURIComponent(item.file_url.split("/").pop() ?? "ontwerp")}`,
          data: new Uint8Array(await res.arrayBuffer()),
        });
      }
    }
  }

  if (entries.length === 0) {
    return NextResponse.json(
      { error: "Deze order heeft nog geen aangeleverde ontwerpen." },
      { status: 404 },
    );
  }

  const zip = buildZip(entries);
  return new NextResponse(Buffer.from(zip), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="ontwerpen-${order.order_number}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
