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
    accent: "forest",
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
    accent: "terracotta",
    image: {
      src: "/proces/levering.jpg",
      alt: "Ingepakte bestelling wordt overhandigd aan de bezorger",
    },
    title: "Levering aan de deur",
    body: "Binnen ± 5 werkdagen bezorgd, inclusief het CSRD-materiaalpaspoort bij je bestelling.",
    badge: "± 5 werkdagen",
  },
];

export function ProcesStappen() {
  return (
    <section className={styles.section} aria-labelledby="proces-title">
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
            Snel, simpel en volledig duurzaam.
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

      {/* Onder de golvende groene hem stroomt water met microplastic-deeltjes —
          precies wat wij níét achterlaten. Groen staat vóór, water erachter. */}
      <div className={styles.water} aria-hidden="true">
        {/* Eén SVG → gegarandeerde schildervolgorde: blauw water achter, groene
            golven eroverheen (boven én onder), naadloos in de forest-footer. */}
        <svg
          className={styles.waterSvg}
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="dv-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7fb0c2" />
              <stop offset="100%" stopColor="#548397" />
            </linearGradient>
          </defs>
          {/* Blauw water (basis, achter alles). */}
          <rect x="0" y="0" width="1440" height="160" fill="url(#dv-water)" />
          {/* Golvende groene bodem → naadloos verder in de forest-footer. */}
          <path
            d="M0,108 C240,88 480,128 720,108 C960,88 1200,128 1440,108 L1440,160 L0,160 Z"
            fill="#2c5f4f"
          />
          {/* Golvende groene hem — de sectie, vóór (over) het water. */}
          <path
            d="M0,0 L1440,0 L1440,44 C1200,64 960,26 720,46 C480,66 240,28 0,44 Z"
            fill="#2c5f4f"
          />
        </svg>
        {/* Microplastic-deeltjes die in de blauwe strook dobberen. */}
        <span className={`${styles.speck} ${styles.speck1}`} />
        <span className={`${styles.speck} ${styles.speck2}`} />
        <span className={`${styles.speck} ${styles.speck3}`} />
        <span className={`${styles.speck} ${styles.speck4}`} />
        <span className={`${styles.speck} ${styles.speck5}`} />
        <span className={`${styles.speck} ${styles.speck6}`} />
        <span className={`${styles.speck} ${styles.speck7}`} />
        <span className={`${styles.speck} ${styles.speck8}`} />
        <span className={`${styles.speck} ${styles.speck9}`} />
        <span className={`${styles.speck} ${styles.speck10}`} />
      </div>
    </section>
  );
}
