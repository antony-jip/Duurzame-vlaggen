"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Vult straat en plaats zodra postcode en huisnummer compleet zijn (NL).
 *
 * Scheelt de klant vier velden typen op de pagina waar hij het minst geduld
 * heeft. Bewust terughoudend:
 *  - alleen Nederland (de bron is de BAG);
 *  - vult alléén lege velden, dus wie zelf iets intikte houdt zijn eigen tekst;
 *  - faalt stil — geen treffer of een trage bron betekent gewoon zelf typen,
 *    nooit een blokkade op de betaalflow.
 */

export type Zoekstatus = "leeg" | "bezig" | "gevonden" | "niet-gevonden";

interface Gevonden {
  straat: string;
  plaats: string;
}

const POSTCODE_RE = /^\d{4}\s*[a-zA-Z]{2}$/;
const HUISNUMMER_RE = /^\d{1,5}$/;

export function useAdresZoeker(onGevonden: (adres: Gevonden) => void) {
  const [status, setStatus] = useState<Zoekstatus>("leeg");
  // De callback mag wijzigen zonder de zoekactie opnieuw te starten.
  const callbackRef = useRef(onGevonden);
  useEffect(() => {
    callbackRef.current = onGevonden;
  }, [onGevonden]);

  const laatsteRef = useRef<string>("");

  const zoek = useCallback(async (postcode: string, huisnummer: string, land: string) => {
    if (land !== "NL") return setStatus("leeg");
    const pc = postcode.trim();
    const nr = huisnummer.trim();
    if (!POSTCODE_RE.test(pc) || !HUISNUMMER_RE.test(nr)) return setStatus("leeg");

    // Zelfde adres twee keer bevragen heeft geen zin (blur vuurt vaak).
    const sleutel = `${pc.replace(/\s+/g, "").toUpperCase()}-${nr}`;
    if (laatsteRef.current === sleutel) return;
    laatsteRef.current = sleutel;

    setStatus("bezig");
    try {
      const res = await fetch(
        `/api/adres?postcode=${encodeURIComponent(pc)}&huisnummer=${encodeURIComponent(nr)}`,
      );
      const data = await res.json();
      if (data?.gevonden) {
        callbackRef.current({ straat: data.straat, plaats: data.plaats });
        setStatus("gevonden");
      } else {
        setStatus("niet-gevonden");
      }
    } catch {
      setStatus("niet-gevonden");
    }
  }, []);

  return { status, zoek };
}

/**
 * Zoekt terwijl je typt, met een korte pauze zodat we niet bij elke toets een
 * verzoek doen. Blur alléén was te laat: je tikt postcode en huisnummer en er
 * gebeurt niets tot je het veld verlaat.
 */
export function useAdresZoekerBijTypen(
  zoek: (postcode: string, huisnummer: string, land: string) => void,
  vertragingMs = 350,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return useCallback(
    (postcode: string, huisnummer: string, land: string) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => zoek(postcode, huisnummer, land), vertragingMs);
    },
    [zoek, vertragingMs],
  );
}
