import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Postcode + huisnummer → straat en plaats.
 *
 * Bron: PDOK Locatieserver (Kadaster/BZK). Gratis, officieel en zonder sleutel,
 * dus geen abonnement zoals bij de commerciële postcode-API's.
 *
 * Waarom een eigen route en geen fetch vanuit de browser:
 *  - geen CORS-afhankelijkheid van een externe partij in de betaalflow;
 *  - we kunnen cachen (adressen veranderen zelden);
 *  - de bron is vervangbaar zonder de client aan te raken.
 *
 * LET OP: we filteren exact op postcode én huisnummer. De vrije-tekst-zoekactie
 * van PDOK is fuzzy en verzint een buurman: "1011AB 7" gaf "De Ruijterkade
 * 105-H" terug. Op een verzendadres wil je liever niets dan iets verkeerds.
 */

const Query = z.object({
  // 1234AB, met of zonder spatie, hoofdletterongevoelig.
  postcode: z
    .string()
    .trim()
    .regex(/^\d{4}\s*[a-zA-Z]{2}$/, "Ongeldige postcode"),
  huisnummer: z.string().trim().regex(/^\d{1,5}$/, "Ongeldig huisnummer"),
});

const PdokAntwoord = z.object({
  response: z.object({
    numFound: z.number(),
    docs: z
      .array(
        z.object({
          straatnaam: z.string(),
          woonplaatsnaam: z.string(),
        }),
      )
      .default([]),
  }),
});

const PDOK = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = Query.safeParse({
    postcode: searchParams.get("postcode") ?? "",
    huisnummer: searchParams.get("huisnummer") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ gevonden: false }, { status: 400 });
  }

  const postcode = parsed.data.postcode.replace(/\s+/g, "").toUpperCase();
  const { huisnummer } = parsed.data;

  const url =
    `${PDOK}?q=*:*&rows=1&fl=straatnaam,woonplaatsnaam` +
    `&fq=type:adres&fq=postcode:${postcode}&fq=huisnummer:${huisnummer}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
      // Adressen veranderen zelden; een dag cachen scheelt PDOK en de klant tijd.
      next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({ gevonden: false }, { status: 502 });

    const data = PdokAntwoord.parse(await res.json());
    const doc = data.response.docs[0];
    if (!doc) return NextResponse.json({ gevonden: false });

    return NextResponse.json({
      gevonden: true,
      straat: doc.straatnaam,
      plaats: doc.woonplaatsnaam,
    });
  } catch {
    // Trager of onbereikbaar: nooit de checkout blokkeren. De klant typt zelf.
    return NextResponse.json({ gevonden: false }, { status: 502 });
  }
}
