import { describe, expect, it } from "vitest";
import type { OrderRow } from "@/lib/db/types";
import {
  lifecycleMail,
  ontwerpenAanleveren,
  portaalNotificatie,
} from "@/lib/email/templates";

/**
 * Copy-guardrails voor de portaal- en lifecycle-mails: factsheet-claims kloppen
 * (96%, nooit 100%), de kritieke links staan erin, en klantinvoer wordt
 * geëscaped. De 100%-check draait op de platte-tekstvariant — de HTML bevat
 * CSS als width:100%, en dat is geen claim.
 */

function order(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    id: "o1",
    order_number: "DV-20260716-TEST",
    market: "nl-NL",
    currency: "EUR",
    customer_id: null,
    email: "klant@voorbeeld.nl",
    phone: null,
    status: "awaiting_files",
    billing_address: null,
    shipping_address: { first_name: "Antony" },
    is_business: false,
    vat_number: null,
    vat_number_valid: null,
    vat_validated_at: null,
    reverse_charge: false,
    vat_rate: 21,
    subtotal_ex_vat: 100,
    shipping_cost: 0,
    vat_amount: 21,
    total: 121,
    mollie_payment_id: null,
    mollie_status: null,
    probo_order_id: null,
    probo_status: null,
    carrier: null,
    tracking_url: null,
    portal_token: "tok",
    portal_expires_at: null,
    reorder_token: "rtok",
    created_at: "2026-07-16T00:00:00Z",
    paid_at: null,
    ordered_at: null,
    shipped_at: null,
    updated_at: "2026-07-16T00:00:00Z",
    ...overrides,
  } as OrderRow;
}

describe("ontwerpenAanleveren", () => {
  it("bevat de portaallink, het aantal en de geldigheid", () => {
    const mail = ontwerpenAanleveren(order(), 2, "https://site/aanleveren/tok", 90);
    expect(mail.onderwerp).toContain("2 ontwerpen");
    expect(mail.html).toContain("https://site/aanleveren/tok");
    expect(mail.html).toContain("90 dagen geldig");
    expect(mail.tekst).toContain("https://site/aanleveren/tok");
    expect(mail.html).toContain("Hoi Antony,");
  });
});

describe("portaalNotificatie", () => {
  it("meldt vervanging en resterende ontwerpen", () => {
    const mail = portaalNotificatie({
      order: order(),
      kind: "replaced",
      fileName: "logo-v2.pdf",
      itemLabel: "Baniervlag",
      remainingPending: 1,
      adminUrl: "https://site/admin/orders/o1",
    });
    expect(mail.onderwerp).toContain("vervangen");
    expect(mail.html).toContain("logo-v2.pdf");
    expect(mail.html).toContain("nog 1 ontwerp");
    expect(mail.html).toContain("/admin/orders/o1");
  });

  it("meldt bij compleet dat er handmatig besteld kan worden", () => {
    const mail = portaalNotificatie({
      order: order(),
      kind: "delivered",
      fileName: "logo.pdf",
      itemLabel: "Baniervlag",
      remainingPending: 0,
      adminUrl: "https://x/admin/orders/o1",
    });
    expect(mail.onderwerp).toContain("Alle ontwerpen binnen");
    expect(mail.html).toContain("Markeer besteld");
  });

  it("escapet klantinvoer in de HTML", () => {
    const mail = portaalNotificatie({
      order: order({ email: "<script>x</script>@y.nl" }),
      kind: "delivered",
      fileName: "<img src=x>",
      itemLabel: "Baniervlag",
      remainingPending: 0,
      adminUrl: "https://x/admin/orders/o1",
    });
    expect(mail.html).not.toContain("<script>x</script>");
    expect(mail.html).not.toContain("<img src=x>");
  });
});

describe("lifecycleMail", () => {
  for (const stage of ["4m", "8m"] as const) {
    it(`${stage}: factsheet-veilig, met herbestel- en uitschrijflink`, () => {
      const mail = lifecycleMail({
        order: order(),
        stage,
        flagNames: ["Baniervlag"],
        reorderUrl: "https://site/opnieuw/rtok",
        unsubscribeUrl: "https://site/uitschrijven/utok",
      });
      // Nooit "100%" in de copy; wél de 96%-claim.
      expect(mail.tekst).not.toMatch(/100\s?%/);
      expect(mail.tekst).toContain("96%");
      expect(mail.html).toContain("96%");
      expect(mail.html).toContain("https://site/opnieuw/rtok");
      expect(mail.html).toContain("https://site/uitschrijven/utok");
      expect(mail.tekst).toContain("https://site/uitschrijven/utok");
      expect(mail.html).toContain("DV-20260716-TEST");
    });
  }
});
