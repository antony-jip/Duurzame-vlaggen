import Image from "next/image";
import styles from "./KlantLogos.module.css";

/**
 * Klanten van Sign Company, het bedrijf achter Duurzame Vlaggen. Dezelfde set
 * als de logo-band op signcompany.nl (assets/2026/08/klantlogo), hier
 * verkleind naar 80px hoog en met een CSS-filter naar wit gezet, zodat elk
 * logo (wit, zwart of kleur in de bron) hetzelfde oogt op het forest.
 *
 * `lh` = weergavehoogte in px per logo: een rond beeldmerk (KWS, Renolit) mag
 * hoger dan een lang woordmerk (Gourmet, Ronico), anders oogt het ene log
 * reusachtig en het andere als een streepje. Waarden overgenomen van
 * signcompany.nl. `w` is de echte pixelbreedte van het bestand (hoogte 80).
 * Renolit ontbreekt bewust: dat logo is wit op een zwart vlak en wordt door de
 * filter een dichte witte tegel.
 */
const LOGOS: ReadonlyArray<{ file: string; alt: string; w: number; lh: number }> = [
  { file: "westcord", alt: "WestCord Hotels", w: 110, lh: 38 },
  { file: "syngenta", alt: "Syngenta", w: 268, lh: 26 },
  { file: "albert-heijn", alt: "Albert Heijn", w: 76, lh: 44 },
  { file: "abovomaxlead", alt: "Abovo Maxlead", w: 154, lh: 33 },
  { file: "tabor", alt: "Tabor College d'Ampte", w: 283, lh: 25 },
  { file: "schouten-techniek", alt: "Schouten Techniek", w: 215, lh: 28 },
  { file: "kws", alt: "KWS", w: 58, lh: 44 },
  { file: "episode", alt: "Episode", w: 223, lh: 28 },
  { file: "contest-yachts", alt: "Contest Yachts", w: 101, lh: 40 },
  { file: "florex", alt: "Florex", w: 115, lh: 37 },
  { file: "vkg", alt: "VKG", w: 189, lh: 30 },
  { file: "kuin", alt: "Aannemingsbedrijf Kuin", w: 329, lh: 23 },
  { file: "present", alt: "Present", w: 333, lh: 23 },
  { file: "martinuscollege", alt: "Martinuscollege", w: 189, lh: 30 },
  { file: "schadenberg", alt: "Schadenberg Groen", w: 298, lh: 24 },
  { file: "ngage", alt: "NGAGE", w: 122, lh: 36 },
  { file: "rsg", alt: "RSG", w: 168, lh: 32 },
  { file: "sed", alt: "SED", w: 157, lh: 32 },
  { file: "australian", alt: "Australian", w: 100, lh: 40 },
  { file: "hetvlees-centrum", alt: "Het Vlees Centrum", w: 265, lh: 26 },
  { file: "sph", alt: "Seed Processing Holland", w: 153, lh: 33 },
  { file: "dirk", alt: "Dirk", w: 90, lh: 42 },
  { file: "compagnioeshaven", alt: "Compagnieshaven", w: 274, lh: 25 },
  { file: "gitzels", alt: "Gitzels", w: 178, lh: 31 },
  { file: "groot-en-groot", alt: "Groot & Groot", w: 269, lh: 25 },
  { file: "ronico", alt: "Ronico", w: 383, lh: 22 },
  { file: "de-werf", alt: "De Werf", w: 77, lh: 44 },
  { file: "gourmet", alt: "Gourmet", w: 503, lh: 22 },
];

function LogoSet({ decoratief }: { decoratief?: boolean }) {
  return (
    <div className={styles.set} aria-hidden={decoratief || undefined}>
      {LOGOS.map((logo) => (
        <Image
          key={logo.file}
          src={`/klanten/${logo.file}.png`}
          alt={decoratief ? "" : logo.alt}
          width={logo.w}
          height={80}
          // Kleine PNG's die al op maat staan: niet door de image-optimizer,
          // dat zou 29 bronbeelden per deploy aan het quotum kosten.
          unoptimized
          loading="lazy"
          className={styles.logo}
          style={{ "--lh": logo.lh } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/**
 * Doorlopende logoband. Twee identieke sets achter elkaar; de baan schuift
 * één set-breedte op en springt dan onzichtbaar terug. Bij een
 * bewegingsvoorkeur staat de band stil en scrolt hij met de vinger.
 */
export function KlantLogos() {
  return (
    <div className={styles.loop} role="img" aria-label="Logo's van klanten van Sign Company">
      <div className={styles.spoor}>
        <LogoSet />
        <LogoSet decoratief />
      </div>
    </div>
  );
}
