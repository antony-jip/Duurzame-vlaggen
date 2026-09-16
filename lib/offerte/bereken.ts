import { getProduct, isOrderable } from "@/lib/catalog/products";
import {
  getSize,
  isLosseArtikelOptie,
  localAccessoiresTotal,
  localLinePrice,
  localShipping,
  ontwerpserviceVoorOrder,
  parseArtikelDeel,
  staffelDiscount,
} from "@/lib/pricing/local-catalog";
import { SELLER_COUNTRY, VAT_RATES } from "@/lib/vat/rates";

/**
 * Offerte uit een samenstelling (configurator) of een hele winkelmand.
 *
 * Gemeenten en instellingen bestellen niet met iDEAL: ze stellen samen, vragen
 * een offerte en laten die intern goedkeuren. De browser stuurt de KEUZES mee,
 * nooit bedragen. We rekenen elke regel opnieuw uit met precies dezelfde
 * functies als `buildLocalQuote` (lib/orders/orchestration.ts), zodat de
 * offerte hetzelfde bedrag noemt als de winkelmand en een aangepaste request
 * geen goedkopere offerte oplevert dan de site zelf.
 *
 * Pure functie (geen IO), zodat de route dun blijft en dit testbaar is.
 */

/** Hoe lang de prijs op de offerte vaststaat. */
export const OFFERTE_GELDIG_DAGEN = 30;
export const OFFERTE_MAX_REGELS = 25;
export const OFFERTE_MAX_AANTAL = 10_000;

/** Zelfde vorm als een winkelmandregel richting checkout (`CheckoutLine`). */
export interface OfferteInvoerRegel {
  slug: string;
  sizeLabel: string;
  widthCm?: number;
  heightCm?: number;
  amount: number;
  options: Array<{ code: string; value?: string | number }>;
}

export interface OfferteRegel {
  omschrijving: string;
  detail: string;
  aantal: number;
  /** null = niet online geprijsd, de prijs volgt met de hand. */
  stukprijs: number | null;
  totaal: number | null;
}

export interface OfferteBerekening {
  /** Kort onderwerp: productnaam, of "N producten". */
  onderwerp: string;
  regels: OfferteRegel[];
  subtotaal: number;
  verzending: number;
  btwPct: number;
  btw: number;
  totaal: number;
  /** True als minstens één regel met de hand geprijsd moet worden. */
  handwerk: boolean;
}

export type OfferteResultaat =
  | { ok: true; offerte: OfferteBerekening }
  | { ok: false; fout: string };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Opties die niet op de regel-omschrijving horen (staan er al anders). */
const NIET_IN_DETAIL = new Set(["Formaat", "Ontwerpservice"]);

export function berekenOfferte(invoer: OfferteInvoerRegel[]): OfferteResultaat {
  if (invoer.length === 0) return { ok: false, fout: "Er is nog niets samengesteld." };
  if (invoer.length > OFFERTE_MAX_REGELS) return { ok: false, fout: "Te veel regels." };

  const regels: OfferteRegel[] = [];
  const selectiesPerRegel: Array<{ selections: Record<string, string> }> = [];
  let handwerk = false;

  for (const item of invoer) {
    const product = getProduct(item.slug);
    if (!product) return { ok: false, fout: "Onbekend product." };

    const amount = Math.floor(Number(item.amount));
    if (!Number.isFinite(amount) || amount < 1 || amount > OFFERTE_MAX_AANTAL) {
      return { ok: false, fout: "Ongeldig aantal." };
    }

    // Zelfde selections als de checkout (`selectionsOf`): alles behalve Formaat.
    const selections: Record<string, string> = {};
    for (const o of item.options ?? []) {
      if (o.code === "Formaat") continue;
      selections[String(o.code)] = String(o.value ?? "");
    }

    // Keuzes van echte productopties moeten bestaan. Anders staat er iets op de
    // offerte dat het prijsmodel niet kent en dus niet geprijsd heeft.
    for (const [label, waarde] of Object.entries(selections)) {
      const optie = product.options.find((o) => o.label === label);
      if (!optie) continue;
      for (const deel of waarde.split(" · ").filter(Boolean)) {
        const { qty, name } = isLosseArtikelOptie(label)
          ? parseArtikelDeel(deel)
          : { qty: 1, name: deel };
        if (!optie.choices.includes(name) || qty < 1 || qty > OFFERTE_MAX_AANTAL) {
          return { ok: false, fout: `Onbekende keuze bij ${label}.` };
        }
      }
    }
    selectiesPerRegel.push({ selections });

    const detail = [
      item.sizeLabel,
      ...Object.entries(selections)
        .filter(
          ([label, waarde]) => waarde && !NIET_IN_DETAIL.has(label) && !isLosseArtikelOptie(label),
        )
        .map(([label, waarde]) => `${label}: ${waarde}`),
    ]
      .filter(Boolean)
      .join(" · ")
      .slice(0, 600);

    // Niet online bestelbaar (bv. vlaggenmast) of een op-aanvraag-maat: die
    // prijzen we niet automatisch. De regel staat erop, de prijs volgt.
    const size = item.sizeLabel ? getSize(product, item.sizeLabel) : undefined;
    if (!isOrderable(product) || size?.quoteOnly) {
      handwerk = true;
      regels.push({ omschrijving: product.name, detail, aantal: amount, stukprijs: null, totaal: null });
      continue;
    }

    const totaal = localLinePrice({
      product,
      size,
      widthCm: item.widthCm,
      heightCm: item.heightCm,
      amount,
      selections,
    });
    // Accessoires zijn losse artikelen met een eigen aantal (buiten staffel):
    // op een eigen regel, zodat de stukprijs van de vlag klopt.
    const accessoires = localAccessoiresTotal(product, selections);
    const vlaggen = round2(totaal - accessoires);
    const korting = staffelDiscount(amount);
    regels.push({
      omschrijving: product.name,
      detail: korting > 0 ? `${detail} · incl. ${Math.round(korting * 100)}% staffelkorting` : detail,
      aantal: amount,
      stukprijs: round2(vlaggen / amount),
      totaal: vlaggen,
    });
    if (accessoires > 0) {
      regels.push({
        omschrijving: `Accessoires bij ${product.name.toLowerCase()}`,
        detail: Object.entries(selections)
          .filter(([label]) => isLosseArtikelOptie(label))
          .map(([, waarde]) => waarde)
          .join(" · "),
        aantal: 1,
        stukprijs: accessoires,
        totaal: accessoires,
      });
    }
  }

  // Eenmalig per offerte, precies zoals de checkout.
  const ontwerp = ontwerpserviceVoorOrder(selectiesPerRegel);
  if (ontwerp > 0) {
    regels.push({
      omschrijving: "Ontwerpservice",
      detail: "Wij zetten je ontwerp drukklaar op, eenmalig per order",
      aantal: 1,
      stukprijs: ontwerp,
      totaal: ontwerp,
    });
  }

  const subtotaal = round2(regels.reduce((som, r) => som + (r.totaal ?? 0), 0));
  // Verzending rekent de checkout op de productregels zonder ontwerpservice.
  const verzending = localShipping(round2(subtotaal - ontwerp));
  const btwPct = VAT_RATES[SELLER_COUNTRY];
  const btw = round2((subtotaal + verzending) * (btwPct / 100));
  const totaal = round2(subtotaal + verzending + btw);

  const producten = regels.filter(
    (r) => r.omschrijving !== "Ontwerpservice" && !r.omschrijving.startsWith("Accessoires"),
  );
  const onderwerp =
    producten.length === 1 ? producten[0].omschrijving : `${producten.length} producten`;

  return {
    ok: true,
    offerte: { onderwerp, regels, subtotaal, verzending, btwPct, btw, totaal, handwerk },
  };
}

/** Offertenummer zonder database: datum + 4 tekens, leesbaar aan de telefoon. */
export function nieuwOffertenummer(nu = new Date()): string {
  const d = nu.toISOString().slice(2, 10).replace(/-/g, "");
  const tekens = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let staart = "";
  for (let i = 0; i < 4; i++) {
    staart += tekens[Math.floor(Math.random() * tekens.length)];
  }
  return `OF-${d}-${staart}`;
}
