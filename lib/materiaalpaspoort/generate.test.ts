import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import type { OrderItemRow, OrderRow } from "@/lib/db/types";
import { generateMateriaalpaspoort } from "./generate";

/**
 * Rooktest op het inkoopdossier.
 *
 * Het dossier groeide van vijf regels duurzaamheidscijfers naar de vier
 * ASTM-uitkomsten, de herkomst van het doek en de certificaten. Daarmee past het
 * niet meer gegarandeerd op één A4, en de oude `Cursor` tekende gewoon door
 * onder de rand van het papier: onzichtbaar kapot, alleen te zien door de pdf
 * te openen. Vandaar dat hier op paginering wordt getest en niet alleen op
 * "hij crasht niet".
 */

function order(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    order_number: "DV-2026-0042",
    email: "inkoop@gemeente-voorbeeld.nl",
    created_at: "2026-07-20T10:00:00.000Z",
    paid_at: "2026-07-20T10:05:00.000Z",
    shipping_address: {
      company_name: "Gemeente Voorbeeld",
      first_name: "Jan",
      last_name: "de Vries",
    },
    ...overrides,
  } as OrderRow;
}

function regel(overrides: Partial<OrderItemRow> = {}): OrderItemRow {
  return {
    id: "00000000-0000-0000-0000-000000000002",
    product_type: "mastvlag",
    product_name: "Mastvlag",
    amount: 3,
    configuration: { sizeLabel: "225 × 150 cm" },
    ...overrides,
  } as OrderItemRow;
}

describe("materiaalpaspoort", () => {
  it("levert een geldige pdf op", async () => {
    const bytes = await generateMateriaalpaspoort(order(), [regel()]);
    expect(bytes.byteLength).toBeGreaterThan(1000);
    // %PDF-magic: anders is het geen pdf maar een hoop bytes.
    expect(Buffer.from(bytes.slice(0, 4)).toString()).toBe("%PDF");
  });

  it("houdt een kleine order compact", async () => {
    const bytes = await generateMateriaalpaspoort(order(), [regel()]);
    const doc = await PDFDocument.load(bytes);
    // Twee pagina's is het maximum voor een enkele regel; meer betekent dat er
    // ongemerkt inhoud is bijgekomen die niemand meer leest.
    expect(doc.getPageCount()).toBeLessThanOrEqual(2);
  });

  it("prikt een pagina bij wanneer de order te lang wordt", async () => {
    // Gemeten: tot twintig regels past op twee pagina's, veertig niet meer.
    const veelRegels = Array.from({ length: 40 }, (_, i) =>
      regel({ id: `regel-${i}`, product_name: `Baniervlag ${i + 1}` }),
    );
    const doc = await PDFDocument.load(
      await generateMateriaalpaspoort(order(), veelRegels),
    );
    const klein = await PDFDocument.load(
      await generateMateriaalpaspoort(order(), [regel()]),
    );
    expect(doc.getPageCount()).toBeGreaterThan(klein.getPageCount());
  });

  it("draagt het dossiernummer in de metadata", async () => {
    const doc = await PDFDocument.load(
      await generateMateriaalpaspoort(order(), [regel()]),
    );
    expect(doc.getTitle()).toContain("DV-2026-0042");
    // De oude subject noemde het een CSRD-document; dat is het niet.
    expect(doc.getSubject() ?? "").not.toMatch(/csrd/i);
  });

  it("overleeft een order zonder herleidbare maat", async () => {
    // Eigen maten staan niet in de catalogus; de CO2-schatting mag daar niet
    // op stukvallen, want dan komt de hele bestelmail niet aan.
    const bytes = await generateMateriaalpaspoort(order(), [
      regel({ configuration: { sizeLabel: "Eigen: 245 × 130 cm" } }),
    ]);
    expect(bytes.byteLength).toBeGreaterThan(1000);
  });
});
