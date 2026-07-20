import Link from "next/link";
import { Container } from "./Container";
import styles from "./VergelijkVlaggen.module.css";
import {
  HOOFDTEST,
  ONDERBOUWING_LINK_TEKST,
  ONDERBOUWING_PAD,
  pctNl,
} from "@/lib/claims/afbreekbaarheid";

/** Percentage in Nederlandse notatie (94.2 → "94,2"). */

/**
 * "Traditioneel vs. Duurzaam" — het kernverhaal in beeld, met de échte
 * vergelijking eronder: in de zeewatertest volgens ASTM D6691 brak het
 * Flag-CiCLO®-doek voor 94,2% af, onbehandeld polyester voor 3,8%. Beide
 * getallen komen uit dezelfde test, dus ze staan naast elkaar met dezelfde
 * norm en dezelfde termijn erbij. De twee illustraties zijn SVG's uit de
 * merkbibliotheek (public/illustraties).
 */
export function VergelijkVlaggen({
  title = "Traditioneel",
  titleAccent = "Duurzaam",
}: {
  title?: string;
  titleAccent?: string;
}) {
  return (
    <section className={styles.wrap} aria-labelledby="vergelijk-title">
      <Container>
        <h2 id="vergelijk-title" className={styles.title}>
          {title} vs. <span>{titleAccent}</span>
        </h2>

        <div className={styles.grid}>
          {/* Traditioneel / polyester */}
          <article className={`${styles.card} ${styles.polyester}`}>
            <div className={styles.figure}>
              <span className={`${styles.badge} ${styles.badgePoly}`}>
                <span aria-hidden="true">✕</span> Polyester
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/illustraties/traditioneel-polyester.svg"
                alt="Polyester vlag die uiteenvalt in microplastics op kale bodem en in het water"
                className={styles.illu}
                loading="lazy"
              />
            </div>
            <div className={styles.body}>
              <h3 className={styles.cardTitle}>Vezels blijven liggen</h3>
              <p className={styles.cardText}>
                Vezels die tijdens gebruik loslaten breken nauwelijks af. In de
                zeewatertest volgens {HOOFDTEST.norm} kwam onbehandeld polyester
                niet verder dan {pctNl(HOOFDTEST.referentiePct ?? 0)}%.
              </p>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>
                    {pctNl(HOOFDTEST.referentiePct ?? 0)}%
                  </span>
                  <span className={styles.statLabel}>
                    Afgebroken in zeewater
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{HOOFDTEST.duur}</span>
                  <span className={styles.statLabel}>Testduur</span>
                </div>
              </div>
            </div>
          </article>

          {/* Duurzaam / Flag-CiCLO */}
          <article className={`${styles.card} ${styles.ciclo}`}>
            <div className={styles.figure}>
              <span className={`${styles.badge} ${styles.badgeCiclo}`}>
                <span aria-hidden="true">✓</span> Flag-CiCLO®
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/illustraties/duurzaam-flag-ciclo.svg"
                alt="Flag-CiCLO-vlag die afbreekt tot voedingsbodem waar planten uit groeien"
                className={styles.illu}
                loading="lazy"
              />
            </div>
            <div className={styles.body}>
              <h3 className={`${styles.cardTitle} ${styles.cardTitleCiclo}`}>
                Laat minder microplastic achter
              </h3>
              <p className={styles.cardText}>
                Vezels die tijdens gebruik loslaten breken af in plaats van te
                blijven liggen. In dezelfde zeewatertest brak{" "}
                {pctNl(HOOFDTEST.afbraakPct)}% van het doek af.
              </p>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span
                    className={`${styles.statValue} ${styles.statValueCiclo}`}
                  >
                    {pctNl(HOOFDTEST.afbraakPct)}%
                  </span>
                  <span className={styles.statLabel}>
                    Afgebroken in zeewater
                  </span>
                </div>
                <div className={styles.stat}>
                  <span
                    className={`${styles.statValue} ${styles.statValueCiclo}`}
                  >
                    {HOOFDTEST.duur}
                  </span>
                  <span className={styles.statLabel}>Testduur</span>
                </div>
              </div>
            </div>
          </article>
        </div>

        <p className={styles.cardText}>
          Beide getallen komen uit dezelfde test: {HOOFDTEST.norm}, met echte
          mariene micro-organismen.{" "}
          <Link href={ONDERBOUWING_PAD}>{ONDERBOUWING_LINK_TEKST}</Link>
        </p>
      </Container>
    </section>
  );
}
