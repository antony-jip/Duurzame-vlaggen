import { Container } from "./Container";
import styles from "./VergelijkVlaggen.module.css";

/**
 * "Traditioneel vs. Duurzaam" — het kernverhaal in beeld: een polyester vlag die
 * uiteenvalt in microplastics tegenover een Flag-CiCLO®-vlag die volledig
 * biologisch afbreekt. De twee illustraties zijn SVG's uit de merkbibliotheek
 * (public/illustraties). Herbruikbaar op de segment-/infopagina's.
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
              <h3 className={styles.cardTitle}>Laat microplastics achter</h3>
              <p className={styles.cardText}>
                Breekt nooit af. Honderden jaren plastic vervuiling in water en
                bodem.
              </p>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>200+ jaar</span>
                  <span className={styles.statLabel}>Afbraaktijd</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>&infin;</span>
                  <span className={styles.statLabel}>Microplastics</span>
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
                alt="Flag-CiCLO-vlag die volledig afbreekt tot voedingsbodem waar planten uit groeien"
                className={styles.illu}
                loading="lazy"
              />
            </div>
            <div className={styles.body}>
              <h3 className={`${styles.cardTitle} ${styles.cardTitleCiclo}`}>
                Lost volledig op
              </h3>
              <p className={styles.cardText}>
                96% breekt af in 2 tot 3 jaar. Geen sporen, geen microplastics.
                Klaar.
              </p>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={`${styles.statValue} ${styles.statValueCiclo}`}>
                    2 tot 3 jaar
                  </span>
                  <span className={styles.statLabel}>Afbraaktijd</span>
                </div>
                <div className={styles.stat}>
                  <span className={`${styles.statValue} ${styles.statValueCiclo}`}>
                    0%
                  </span>
                  <span className={styles.statLabel}>Microplastics</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}
