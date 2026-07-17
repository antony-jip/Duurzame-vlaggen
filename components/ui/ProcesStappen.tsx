import Image from "next/image";
import { Container } from "./Container";
import styles from "./ProcesStappen.module.css";

/**
 * "Van ontwerp naar levering in 3 simpele stappen" — vertrouwensblok voor
 * onderaan elke productpagina. Copy volgt de échte flow: direct online
 * bestellen (geen offerte/drukproef-stap), wij produceren, en we leveren
 * inclusief materiaalpaspoort.
 */

interface Stap {
  n: number;
  accent: "forest" | "sage-blue" | "terracotta";
  image: { src: string; alt: string };
  title: string;
  body: string;
  badge: string;
}

const STAPPEN: Stap[] = [
  {
    n: 1,
    accent: "terracotta",
    image: {
      src: "/proces/configureren.jpg",
      alt: "Ontwerp wordt in de configurator opgezet achter een beeldscherm",
    },
    title: "Configureer & bestel",
    body: "Kies type, formaat en aantal, upload je ontwerp en reken direct online af. Klaar in een paar minuten.",
    badge: "Klaar in 5 min",
  },
  {
    n: 2,
    accent: "sage-blue",
    image: {
      src: "/proces/productie.jpg",
      alt: "Duurzame vlag wordt op maat gemaakt aan de naaimachine",
    },
    title: "Wij printen & naaien",
    body: "We drukken je ontwerp op Flag-CiCLO®-doek en werken elke vlag met de hand af in Nederland.",
    badge: "Circulair geproduceerd",
  },
  {
    n: 3,
    accent: "forest",
    image: {
      src: "/proces/levering.jpg",
      alt: "Ingepakte bestelling wordt overhandigd aan de bezorger",
    },
    title: "Levering aan de deur",
    body: "Binnen ± 5 werkdagen bezorgd, inclusief het CSRD-materiaalpaspoort bij je bestelling.",
    badge: "± 5 werkdagen",
  },
];

export function ProcesStappen({
  bandImage,
}: {
  /**
   * Maten-overzicht van het product (product.sizesImage) als fotoband boven
   * de footer. Zonder beeld komt er geen band: de sectie eindigt dan gewoon in
   * de forest-footer.
   */
  bandImage?: { src: string; alt: string };
}) {
  return (
    <section
      className={`${styles.section} ${bandImage ? styles.sectionFotoBand : ""}`}
      aria-labelledby="proces-title"
    >
      {/* Wapper-golf — signatuurovergang vanuit de off-white pagina erboven. */}
      <svg
        className={styles.topWave}
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,0 L1440,0 L1440,24 C1200,44 960,6 720,24 C480,42 240,6 0,24 Z"
          fill="var(--color-off-white)"
        />
      </svg>
      <Container>
        <div className={styles.head}>
          <h2 id="proces-title" className={styles.title}>
            Van ontwerp naar levering
            <span className={styles.titleAccent}>in 3 simpele stappen</span>
          </h2>
          <p className={styles.sub}>
            Configureer je vlag, reken direct online af en wij regelen de rest.
            Snel. Simpel. Volledig duurzaam.
          </p>
        </div>

        <ol className={styles.grid}>
          {STAPPEN.map((stap) => (
            <li key={stap.n} className={styles.card} data-accent={stap.accent}>
              <div className={styles.media}>
                <span className={styles.badgeNum} aria-hidden="true">
                  {stap.n}
                </span>
                <Image
                  src={stap.image.src}
                  alt={stap.image.alt}
                  fill
                  sizes="(max-width: 860px) 100vw, 33vw"
                  className={styles.photo}
                />
              </div>
              <div className={styles.body}>
                <h3 className={styles.cardTitle}>{stap.title}</h3>
                <p className={styles.cardBody}>{stap.body}</p>
                <span className={styles.pill}>{stap.badge}</span>
              </div>
            </li>
          ))}
        </ol>
      </Container>

      {bandImage ? (
        /* Onder de golvende groene hem: het maten-overzicht van het product als
           fotoband. Dunne golven boven en onder, zodat de plaat zelf zichtbaar
           blijft en naadloos in de forest-footer overloopt. Alt op de figuur:
           de maten zijn informatie. */
        <figure className={styles.fotoBand}>
          <Image
            src={bandImage.src}
            alt={bandImage.alt}
            fill
            sizes="100vw"
            className={styles.fotoBandBeeld}
          />
          {/* Golvende groene hem — de sectie golft de foto in. */}
          <svg
            className={styles.fotoBandHemBoven}
            viewBox="0 0 1440 72"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,0 L1440,0 L1440,44 C1200,64 960,26 720,46 C480,66 240,28 0,44 Z"
              fill="#2c5f4f"
            />
          </svg>
          {/* Golvende groene bodem → naadloos verder in de forest-footer. */}
          <svg
            className={styles.fotoBandHemOnder}
            viewBox="0 0 1440 72"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,40 C240,72 480,4 720,28 C960,52 1200,12 1440,40 L1440,72 L0,72 Z"
              fill="#2c5f4f"
            />
          </svg>
        </figure>
      ) : null}
    </section>
  );
}
