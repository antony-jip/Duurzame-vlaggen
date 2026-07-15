import { NextResponse } from "next/server";

import { getAdminUser } from "@/app/admin/auth";
import { getOrderById } from "@/lib/orders/repository";
import { bouwMail, type MailSoort } from "@/lib/email/templates";

/**
 * Admin-only: bekijk een klantmail in de browser vóór je 'm verstuurt.
 *
 * Verstuurt niets. Bestaat omdat mail-HTML niet te beoordelen is uit code: je
 * wilt zien wat de klant ziet, zeker met de tabel-layout die e-mailclients
 * eisen.
 */
const GELDIG: MailSoort[] = ["in_productie", "verzonden", "vraag"];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const { id } = await params;
  const soortRuw = new URL(req.url).searchParams.get("soort") ?? "in_productie";
  const soort = (GELDIG.includes(soortRuw as MailSoort) ? soortRuw : "in_productie") as MailSoort;

  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Order niet gevonden" }, { status: 404 });
  }

  const mail = bouwMail(
    soort,
    order,
    // Plaatsvervangend bericht, anders is de vraag-mail in het voorbeeld leeg.
    "Hier komt je eigen bericht te staan.",
  );

  return new NextResponse(mail.html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
