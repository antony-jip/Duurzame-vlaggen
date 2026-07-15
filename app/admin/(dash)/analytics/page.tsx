import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "../../auth";
import { veilig, gscGeconfigureerd } from "@/lib/analytics/gsc";
import {
  haalZoekverkeer,
  periode,
  RANGE_LABEL,
  type Range,
  type Zoekverkeer,
} from "@/lib/analytics/zoekverkeer";
import { bepaalMigratieRisico } from "@/lib/analytics/migratie";
import { haalNummer1Meter, type Stand } from "@/lib/analytics/naar-nummer1";
import { bouwDoelPrompt, bouwWerklijstPrompt } from "@/lib/analytics/prompts";
import { haalKansStanden } from "@/lib/analytics/kans-acties";
import { haalNieuweZoekwoorden } from "@/lib/analytics/snapshot";
import { PromptKnop, BenutToggle } from "./KansActies";
import styles from "./analytics.module.css";

export const metadata: Metadata = {
  title: "Analytics · Admin",
  robots: { index: false, follow: false },
};

/** Search Console-data verandert dagelijks; nooit uit de cache serveren. */
export const dynamic = "force-dynamic";

const RANGES: Range[] = ["7d", "28d", "90d", "6m", "12m"];

const nf = new Intl.NumberFormat("nl-NL");

/* ── Kleine bouwstenen ──────────────────────────────────────────────────── */

/**
 * KPI met periode-vergelijking. `omlaagIsGoed` voor positie: daar is een
 * negatieve delta juist winst.
 */
function Kpi({
  label,
  waarde,
  delta,
  eenheid,
  omlaagIsGoed = false,
}: {
  label: string;
  waarde: string;
  delta: number;
  eenheid: string;
  omlaagIsGoed?: boolean;
}) {
  const beter = omlaagIsGoed ? delta < 0 : delta > 0;
  const neutraal = delta === 0;
  const toon = neutraal ? styles.deltaVlak : beter ? styles.deltaGoed : styles.deltaSlecht;
  const teken = delta > 0 ? "+" : "";

  return (
    <div className={styles.kpi}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiWaarde}>{waarde}</strong>
      <span className={`${styles.delta} ${toon}`}>
        {neutraal ? "·" : beter ? "▲" : "▼"} {teken}
        {delta}
        {eenheid}
      </span>
    </div>
  );
}

/** Staafjes-grafiek in pure CSS. Geen chart-library, conform de rest van de stack. */
function Staafjes({ data }: { data: Zoekverkeer["perDag"] }) {
  const max = Math.max(1, ...data.map((d) => d.impressies));
  // Bij lange vensters wordt elke dag een haartje; toon dan een uitgedund beeld.
  const stap = data.length > 92 ? Math.ceil(data.length / 92) : 1;
  const zichtbaar = data.filter((_, i) => i % stap === 0);

  return (
    <div className={styles.grafiek} role="img" aria-label="Vertoningen en klikken per dag">
      {zichtbaar.map((d, i) => (
        <div key={i} className={styles.staafKolom} title={`${d.label} · ${d.impressies} vertoningen · ${d.clicks} klikken`}>
          <div className={styles.staafImpressies} style={{ height: `${(d.impressies / max) * 100}%` }}>
            <div
              className={styles.staafClicks}
              style={{ height: `${d.impressies ? (d.clicks / d.impressies) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Leeg({ tekst }: { tekst: string }) {
  return <p className={styles.leeg}>{tekst}</p>;
}

/* ── Pagina ─────────────────────────────────────────────────────────────── */

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; toon?: string }>;
}) {
  await requireAdminPage();

  const { range: rawRange, toon } = await searchParams;
  const range: Range = RANGES.includes(rawRange as Range) ? (rawRange as Range) : "28d";
  /** Benutte doelen verbergen is de standaard: je wilt zien wat er nog ligt. */
  const toonBenut = toon === "alles";

  if (!gscGeconfigureerd()) {
    return (
      <div className={styles.page}>
        <header className={styles.kop}>
          <h1 className={styles.titel}>Analytics</h1>
        </header>
        <section className={styles.kaart}>
          <h2 className={styles.kaartTitel}>Search Console nog niet gekoppeld</h2>
          <p className={styles.uitleg}>
            Zet deze drie variabelen in Vercel (of <code>.env.local</code>), daarna vult deze
            pagina zich vanzelf:
          </p>
          <ul className={styles.lijst}>
            <li>
              <code>GSC_CLIENT_EMAIL</code> · het e-mailadres uit de service-account-JSON
            </li>
            <li>
              <code>GSC_PRIVATE_KEY</code> · de private key uit diezelfde JSON (regeleindes
              mogen als letterlijke <code>\n</code>)
            </li>
            <li>
              <code>GSC_SITE_URL</code> · bij voorkeur <code>sc-domain:duurzame-vlaggen.nl</code>
            </li>
          </ul>
          <p className={styles.uitleg}>
            Voeg het service-account daarna in Search Console toe als gebruiker op de property,
            anders geeft Google een 403.
          </p>
        </section>
      </div>
    );
  }

  const { since, totEnMet } = periode(range);
  const res = await veilig(() => haalZoekverkeer(range));

  // Expliciet op null vergelijken: een truthiness-check narrowt de union niet,
  // want TypeScript houdt rekening met een lege foutstring.
  if (res.fout !== null) {
    return (
      <div className={styles.page}>
        <header className={styles.kop}>
          <h1 className={styles.titel}>Analytics</h1>
        </header>
        <section className={`${styles.kaart} ${styles.kaartFout}`}>
          <h2 className={styles.kaartTitel}>Search Console gaf een fout</h2>
          <p className={styles.foutTekst}>{res.fout}</p>
        </section>
      </div>
    );
  }

  const d = res.data;
  const migratie = bepaalMigratieRisico(d.allePaginas);
  const meterRes = await veilig(() => haalNummer1Meter());
  const meter = meterRes.data;

  // Beide raken de database; die kan los stuk zijn van GSC (bijv. ontbrekende
  // service-role key), dus apart afgeschermd zodat de meter blijft staan.
  const standenRes = await veilig(() => haalKansStanden());
  const standen = standenRes.data ?? new Map();
  const nieuwRes = await veilig(() => haalNieuweZoekwoorden(30));
  const nieuweWoorden = nieuwRes.data ?? [];

  // Doelen splitsen op benut, zodat "wat ligt er nog" de standaardweergave is.
  const alleDoelen = meter?.doelen ?? [];
  const benutteDoelen = alleDoelen.filter((d) => standen.get(d.woord)?.status === "benut");
  const openDoelen = alleDoelen.filter((d) => standen.get(d.woord)?.status !== "benut");
  const zichtbareDoelen = toonBenut ? alleDoelen : openDoelen;
  const kansenTotaal =
    d.kansen.lageCtr.length +
    d.kansen.bijnaPagina1.length +
    d.kansen.kannibalisatie.length +
    d.kansen.duplicaatUrls.length;

  return (
    <div className={styles.page}>
      <header className={styles.kop}>
        <div>
          <h1 className={styles.titel}>Analytics</h1>
          <p className={styles.periode}>
            {since} t/m {totEnMet} · Google Search Console
          </p>
        </div>
        <nav className={styles.ranges} aria-label="Periode">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/analytics?range=${r}`}
              className={`${styles.rangeLink} ${r === range ? styles.rangeActief : ""}`}
            >
              {RANGE_LABEL[r]}
            </Link>
          ))}
        </nav>
      </header>

      {/* ── Naar #1. Staat bovenaan: dit is het doel, de rest is diagnose. ── */}
      {meter && (
        <section className={styles.kaart}>
          <div className={styles.kaartKop}>
            <h2 className={styles.kaartTitel}>Naar #1</h2>
            <span className={styles.badge}>
              {meter.telling.top3} van {meter.totaal} in de top 3
            </span>
          </div>
          <p className={styles.uitleg}>
            Elk zoekwoord dat we willen winnen, met de pagina die het hoort te pakken.
            Gemeten over 12 maanden ({meter.since} t/m {meter.totEnMet}), want dit is een
            stand, geen weekcijfer.
          </p>

          <div className={styles.meter} role="img" aria-label="Verdeling van de doelwoorden">
            {(
              [
                ["top3", "Top 3", meter.telling.top3],
                ["pagina1", "Pagina 1", meter.telling.pagina1],
                ["zichtbaar", "In beeld", meter.telling.zichtbaar],
                ["onzichtbaar", "Nog niet in beeld", meter.telling.onzichtbaar],
              ] as const
            ).map(([k, label, n]) =>
              n === 0 ? null : (
                <div
                  key={k}
                  className={`${styles.meterDeel} ${styles[`meter_${k}`]}`}
                  style={{ flexGrow: n }}
                  title={`${label}: ${n}`}
                >
                  <span className={styles.meterCijfer}>{n}</span>
                </div>
              ),
            )}
          </div>
          <p className={styles.legenda}>
            <span className={`${styles.legDot} ${styles.meter_top3}`} /> Top 3
            <span className={`${styles.legDot} ${styles.meter_pagina1}`} /> Pagina 1
            <span className={`${styles.legDot} ${styles.meter_zichtbaar}`} /> In beeld
            <span className={`${styles.legDot} ${styles.meter_onzichtbaar}`} /> Nog niet in beeld
          </p>

          <div className={styles.balk}>
            <PromptKnop
              prompt={bouwWerklijstPrompt(zichtbareDoelen)}
              label={`Kopieer werklijst (${zichtbareDoelen.length})`}
            />
            <Link
              href={`/admin/analytics?range=${range}${toonBenut ? "" : "&toon=alles"}`}
              className={styles.schakel}
            >
              {toonBenut
                ? `Verberg benutte (${benutteDoelen.length})`
                : `Toon ook benutte (${benutteDoelen.length})`}
            </Link>
          </div>

          <table className={styles.tabel}>
            <thead>
              <tr>
                <th>Zoekwoord</th>
                <th className={styles.num}>Positie</th>
                <th className={styles.num}>Naar #1</th>
                <th className={styles.num}>Vert.</th>
                <th>Pagina die het moet pakken</th>
                <th>Actie</th>
              </tr>
            </thead>
            <tbody>
              {zichtbareDoelen.map((doel) => {
                const kansStand = standen.get(doel.woord);
                const isBenut = kansStand?.status === "benut";
                return (
                  <tr key={doel.woord} className={isBenut ? styles.rijBenut : undefined}>
                    <td>
                      {doel.woord}
                      <span className={styles.groep}>{doel.groep}</span>
                    </td>
                    <td className={styles.num}>
                      <span
                        className={`${styles.standPill} ${styles[`meter_${doel.stand as Stand}`]}`}
                      >
                        {doel.positie ?? "—"}
                      </span>
                    </td>
                    <td className={styles.num}>
                      {doel.afstand === null ? (
                        <span className={styles.zacht}>bouwen</span>
                      ) : doel.afstand === 0 ? (
                        <strong>#1</strong>
                      ) : (
                        `${doel.afstand}`
                      )}
                      {/* Stand bij het benutten vs. nu: hielp het? */}
                      {isBenut && kansStand?.positieBij != null && doel.positie !== null && (
                        <span
                          className={
                            doel.positie < kansStand.positieBij
                              ? styles.effectGoed
                              : styles.effectVlak
                          }
                        >
                          was {kansStand.positieBij}
                        </span>
                      )}
                    </td>
                    <td className={styles.num}>{nf.format(doel.impressies)}</td>
                    <td className={styles.pad}>
                      {doel.pagina}
                      {doel.verkeerdePagina && (
                        <span className={styles.mismatch}>nu: {doel.rankendePagina}</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.acties}>
                        <PromptKnop prompt={bouwDoelPrompt(doel)} />
                        <BenutToggle
                          sleutel={doel.woord}
                          bron="doel"
                          positie={doel.positie}
                          impressies={doel.impressies}
                          benut={isBenut}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {standenRes.fout && (
            <p className={styles.foutTekst}>
              De benut-status kon niet geladen worden ({standenRes.fout}). Draai de migratie en
              controleer SUPABASE_SERVICE_ROLE_KEY.
            </p>
          )}
        </section>
      )}

      {/* ── Nieuwe zoekwoorden. Leunt op de dagelijkse snapshot-cron: zonder
          eigen historie kun je niet weten wat nieuw is. ── */}
      {nieuweWoorden.length > 0 && (
        <section className={styles.kaart}>
          <div className={styles.kaartKop}>
            <h2 className={styles.kaartTitel}>Nieuw in Google</h2>
            <span className={styles.badge}>{nieuweWoorden.length} sinds 30 dagen</span>
          </div>
          <p className={styles.uitleg}>
            Zoekwoorden waarop je voor het eerst vertoond bent. Vers signaal: hier beweegt
            Google, dus hier is een duw het meest waard.
          </p>
          <table className={styles.tabel}>
            <thead>
              <tr>
                <th>Zoekwoord</th>
                <th className={styles.num}>Vert.</th>
                <th className={styles.num}>Positie</th>
                <th className={styles.num}>Eerst gezien</th>
              </tr>
            </thead>
            <tbody>
              {nieuweWoorden.slice(0, 15).map((w) => (
                <tr key={w.sleutel}>
                  <td>{w.sleutel}</td>
                  <td className={styles.num}>{nf.format(w.impressies)}</td>
                  <td className={styles.num}>{w.positie}</td>
                  <td className={styles.num}>{w.eersteDag}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Migratie-risico. Staat bovenaan omdat het aflopende tijd is: na
          livegang zijn deze rankings weg. ── */}
      {migratie.risico.length > 0 && (
        <section className={`${styles.kaart} ${styles.kaartAlarm}`}>
          <div className={styles.kaartKop}>
            <h2 className={styles.kaartTitel}>Migratie-risico</h2>
            <span className={styles.badgeAlarm}>
              {nf.format(migratie.clicksOpSpel)} klikken op het spel
            </span>
          </div>
          <p className={styles.uitleg}>
            Deze URL&apos;s van de huidige WordPress-site trekken verkeer, maar hebben géén
            tegenhanger in de nieuwe site. Zonder 301-redirect verdwijnt dit verkeer bij
            livegang. Er staat nu nog geen redirect-map in <code>next.config.ts</code>.
          </p>
          <table className={styles.tabel}>
            <thead>
              <tr>
                <th>Oude URL</th>
                <th className={styles.num}>Klikken</th>
                <th className={styles.num}>Vertoningen</th>
                <th>Voorstel</th>
              </tr>
            </thead>
            <tbody>
              {migratie.risico.slice(0, 15).map((r) => (
                <tr key={r.pagina}>
                  <td className={styles.pad}>{r.pagina}</td>
                  <td className={styles.num}>{nf.format(r.clicks)}</td>
                  <td className={styles.num}>{nf.format(r.impressies)}</td>
                  <td>
                    {r.bekend ? (
                      <span className={styles.voorstel}>→ {r.voorstel}</span>
                    ) : (
                      <span className={styles.besluit}>besluit nodig</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Zoekverkeer ── */}
      <section className={styles.kaart}>
        <h2 className={styles.kaartTitel}>Zoekverkeer</h2>
        <div className={styles.kpis}>
          <Kpi label="Klikken" waarde={nf.format(d.totalen.clicks)} delta={d.delta.clicks} eenheid="%" />
          <Kpi
            label="Vertoningen"
            waarde={nf.format(d.totalen.impressies)}
            delta={d.delta.impressies}
            eenheid="%"
          />
          <Kpi label="Gem. CTR" waarde={`${d.totalen.ctrPct}%`} delta={d.delta.ctrPunt} eenheid="pp" />
          <Kpi
            label="Gem. positie"
            waarde={`${d.totalen.positie}`}
            delta={d.delta.positie}
            eenheid=""
            omlaagIsGoed
          />
        </div>
        {d.perDag.length > 0 ? (
          <>
            <Staafjes data={d.perDag} />
            <p className={styles.legenda}>
              <span className={styles.legImpressies} /> Vertoningen
              <span className={styles.legClicks} /> Klikken
            </p>
          </>
        ) : (
          <Leeg tekst="Nog geen data in dit venster." />
        )}
      </section>

      {/* ── SEO-kansen ── */}
      <section className={styles.kaart}>
        <div className={styles.kaartKop}>
          <h2 className={styles.kaartTitel}>SEO-kansen</h2>
          <span className={styles.badge}>{kansenTotaal} gevonden</span>
        </div>
        <p className={styles.uitleg}>
          Merkgebonden zoekwoorden zijn eruit gefilterd: daar rank je toch al op, dus dat is
          geen kans.
        </p>

        <h3 className={styles.subTitel}>
          <span className={`${styles.pill} ${styles.pillCtr}`}>Lage CTR</span>
          Je staat op pagina 1, maar ze klikken niet
        </h3>
        {d.kansen.lageCtr.length ? (
          <table className={styles.tabel}>
            <thead>
              <tr>
                <th>Zoekwoord</th>
                <th>Pagina</th>
                <th className={styles.num}>Vertoningen</th>
                <th className={styles.num}>CTR</th>
                <th className={styles.num}>Positie</th>
              </tr>
            </thead>
            <tbody>
              {d.kansen.lageCtr.map((k) => (
                <tr key={k.query}>
                  <td>{k.query}</td>
                  <td className={styles.pad}>{k.pagina}</td>
                  <td className={styles.num}>{nf.format(k.impressies)}</td>
                  <td className={styles.num}>{k.ctrPct}%</td>
                  <td className={styles.num}>{k.positie}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Leeg tekst="Geen termen met veel vertoningen en een lage CTR." />
        )}

        <h3 className={styles.subTitel}>
          <span className={`${styles.pill} ${styles.pillBijna}`}>Bijna pagina 1</span>
          Positie 8 tot 20, met echte vraag erachter
        </h3>
        {d.kansen.bijnaPagina1.length ? (
          <table className={styles.tabel}>
            <thead>
              <tr>
                <th>Zoekwoord</th>
                <th>Pagina</th>
                <th className={styles.num}>Vertoningen</th>
                <th className={styles.num}>Positie</th>
              </tr>
            </thead>
            <tbody>
              {d.kansen.bijnaPagina1.map((k) => (
                <tr key={k.query}>
                  <td>{k.query}</td>
                  <td className={styles.pad}>{k.pagina}</td>
                  <td className={styles.num}>{nf.format(k.impressies)}</td>
                  <td className={styles.num}>{k.positie}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Leeg tekst="Geen termen net buiten pagina 1." />
        )}

        <h3 className={styles.subTitel}>
          <span className={`${styles.pill} ${styles.pillKanni}`}>Kannibalisatie</span>
          Meerdere eigen pagina&apos;s vechten om dezelfde term
        </h3>
        {d.kansen.kannibalisatie.length ? (
          <ul className={styles.lijst}>
            {d.kansen.kannibalisatie.slice(0, 8).map((k) => (
              <li key={k.zoekterm}>
                <strong>{k.zoekterm}</strong> · {nf.format(k.impressies)} vertoningen
                <ul className={styles.subLijst}>
                  {k.paginas.map((p) => (
                    <li key={p.pagina} className={styles.pad}>
                      {p.pagina} <span className={styles.zacht}>positie {p.positie}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <Leeg tekst="Geen termen waarvoor meerdere pagina's concurreren." />
        )}

        <h3 className={styles.subTitel}>
          <span className={`${styles.pill} ${styles.pillDup}`}>Dubbele URL&apos;s</span>
          Dezelfde pagina onder meerdere adressen, live geverifieerd
        </h3>
        {d.kansen.duplicaatUrls.length ? (
          <ul className={styles.lijst}>
            {d.kansen.duplicaatUrls.map((k) => (
              <li key={k.paden.join("|")}>
                <strong>{k.zoekterm}</strong>
                <ul className={styles.subLijst}>
                  {k.paden.map((p) => (
                    <li key={p} className={styles.pad}>
                      {p}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <Leeg tekst="Geen dubbele URL's die nu nog allebei bereikbaar zijn." />
        )}
      </section>

      {/* ── GEO / AI ── */}
      <section className={styles.kaart}>
        <h2 className={styles.kaartTitel}>GEO &amp; AI-signalen</h2>
        <p className={styles.uitleg}>
          Indirecte signalen uit Search Console, geen crawler-logs. Hoog ranken met een lage
          CTR wijst meestal op een AI Overview of snippet die de klik wegneemt.
        </p>
        <div className={styles.tweeKolom}>
          <div>
            <h3 className={styles.subTitel}>Klik gestolen</h3>
            {d.geo.snippetSteal.length ? (
              <table className={styles.tabel}>
                <thead>
                  <tr>
                    <th>Zoekwoord</th>
                    <th className={styles.num}>Vert.</th>
                    <th className={styles.num}>CTR</th>
                    <th className={styles.num}>Pos.</th>
                  </tr>
                </thead>
                <tbody>
                  {d.geo.snippetSteal.map((t) => (
                    <tr key={t.query}>
                      <td>{t.query}</td>
                      <td className={styles.num}>{nf.format(t.impressies)}</td>
                      <td className={styles.num}>{t.ctrPct}%</td>
                      <td className={styles.num}>{t.positie}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Leeg tekst="Geen signalen." />
            )}
          </div>
          <div>
            <h3 className={styles.subTitel}>Vraag-zoekopdrachten</h3>
            {d.geo.vraagQueries.length ? (
              <table className={styles.tabel}>
                <thead>
                  <tr>
                    <th>Zoekwoord</th>
                    <th className={styles.num}>Vert.</th>
                    <th className={styles.num}>Pos.</th>
                  </tr>
                </thead>
                <tbody>
                  {d.geo.vraagQueries.map((t) => (
                    <tr key={t.query}>
                      <td>{t.query}</td>
                      <td className={styles.num}>{nf.format(t.impressies)}</td>
                      <td className={styles.num}>{t.positie}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Leeg tekst="Geen vraag-achtige zoekopdrachten." />
            )}
          </div>
        </div>
      </section>

      {/* ── Bewegers ── */}
      <section className={styles.kaart}>
        <h2 className={styles.kaartTitel}>Groei &amp; bewegers</h2>
        <p className={styles.uitleg}>
          Verschil in klikken t.o.v. de vorige {RANGE_LABEL[range].toLowerCase()}. Termen die
          volledig wegvielen tellen mee als daler.
        </p>
        <div className={styles.tweeKolom}>
          {(
            [
              ["Stijgers · zoekwoorden", d.bewegers.queries.stijgers],
              ["Dalers · zoekwoorden", d.bewegers.queries.dalers],
              ["Stijgers · pagina's", d.bewegers.paginas.stijgers],
              ["Dalers · pagina's", d.bewegers.paginas.dalers],
            ] as const
          ).map(([titel, rijen]) => (
            <div key={titel}>
              <h3 className={styles.subTitel}>{titel}</h3>
              {rijen.length ? (
                <ul className={styles.miniLijst}>
                  {rijen.map((b) => (
                    <li key={b.naam}>
                      <span className={styles.miniNaam}>{b.naam}</span>
                      <span className={b.dClicks > 0 ? styles.deltaGoed : styles.deltaSlecht}>
                        {b.dClicks > 0 ? "+" : ""}
                        {b.dClicks}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Leeg tekst="Geen beweging." />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Top-zoektermen + pagina's ── */}
      <section className={styles.kaart}>
        <h2 className={styles.kaartTitel}>Top-zoektermen</h2>
        {d.topZoektermen.length ? (
          <table className={styles.tabel}>
            <thead>
              <tr>
                <th>Zoekwoord</th>
                <th className={styles.num}>Klikken</th>
                <th className={styles.num}>Vertoningen</th>
                <th className={styles.num}>CTR</th>
                <th className={styles.num}>Positie</th>
              </tr>
            </thead>
            <tbody>
              {d.topZoektermen.map((t) => (
                <tr key={t.query}>
                  <td>{t.query}</td>
                  <td className={styles.num}>{nf.format(t.clicks)}</td>
                  <td className={styles.num}>{nf.format(t.impressies)}</td>
                  <td className={styles.num}>{t.ctrPct}%</td>
                  <td className={styles.num}>{t.positie}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Leeg tekst="Nog geen zoektermen." />
        )}
      </section>

      <section className={styles.kaart}>
        <h2 className={styles.kaartTitel}>Waar het verkeer landt</h2>
        <div className={styles.tweeKolom}>
          <div>
            <h3 className={styles.subTitel}>Top-landingspagina&apos;s</h3>
            {d.topPaginas.length ? (
              <ul className={styles.miniLijst}>
                {d.topPaginas.map((p) => (
                  <li key={p.pagina}>
                    <span className={`${styles.miniNaam} ${styles.pad}`}>{p.pagina}</span>
                    <span>{nf.format(p.clicks)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Leeg tekst="Geen data." />
            )}
          </div>
          <div>
            <h3 className={styles.subTitel}>Apparaten</h3>
            <ul className={styles.miniLijst}>
              {d.apparaten.map((a) => (
                <li key={a.label}>
                  <span className={styles.miniNaam}>{a.label}</span>
                  <span>{nf.format(a.clicks)}</span>
                </li>
              ))}
            </ul>
            <h3 className={styles.subTitel}>Landen</h3>
            <ul className={styles.miniLijst}>
              {d.landen.map((l) => (
                <li key={l.label}>
                  <span className={styles.miniNaam}>{l.label}</span>
                  <span>{nf.format(l.clicks)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
