import { describe, expect, it } from "vitest";
import { configureProduct, getPrice } from "@/lib/probo/products";
import { buildProboOptions } from "@/lib/catalog/probo-mapping";
import { getProduct } from "@/lib/catalog/products";

const ADDR = {
  company_name: "Test BV", first_name: "Jan", last_name: "Test",
  street: "Teststraat", house_number: "1", postal_code: "1000AA", city: "Amsterdam", country: "NL",
};

async function check(slug: string, widthCm: number, heightCm: number, selections: Record<string, string>) {
  const mapped = buildProboOptions(slug, { widthCm, heightCm, amount: 1, selections })!;
  const products = [{ code: mapped.productCode, options: mapped.options }];
  const conf = await configureProduct({ products });
  const price = await getPrice({ products, deliveries: [{ address: ADDR }] });
  return { code: mapped.productCode, calcId: conf.calculationId, purchase: price.purchasePrice };
}

describe.skipIf(!process.env.PROBO_API_KEY)("mapping-output live validation beach/gevel", () => {
  it("beachvlag: every catalogue size configures + prices via the mapping", async () => {
    const product = getProduct("beachvlag")!;
    for (const size of product.sizes) {
      const r = await check("beachvlag", size.widthCm!, size.heightCm!, {
        Mastzijde: "Links", Voet: "Grondpin",
      });
      // eslint-disable-next-line no-console
      console.log(`[beachvlag] ${size.label} → ${r.code} purchase=€${r.purchase}`);
      expect(r.calcId.length, size.label).toBeGreaterThan(0);
      expect(r.purchase, size.label).toBeGreaterThan(0);
    }
  }, 300_000);

  it("gevelvlag: every catalogue size configures + prices via the mapping", async () => {
    const product = getProduct("gevelvlag")!;
    for (const size of product.sizes) {
      const r = await check("gevelvlag", size.widthCm!, size.heightCm!, {
        Mastzijde: "Rechts", Uithouder: "Met uithouder",
      });
      // eslint-disable-next-line no-console
      console.log(`[gevelvlag] ${size.label} → ${r.code} purchase=€${r.purchase}`);
      expect(r.calcId.length, size.label).toBeGreaterThan(0);
      expect(r.purchase, size.label).toBeGreaterThan(0);
    }
  }, 300_000);
});
