import Image from "next/image";
import Link from "next/link";
import styles from "./landenvlaggen.module.css";
import { Check, Leaf, ShieldCheck, Truck } from "@/components/ui";

/**
 * Gedeelde blokken van de landenvlaggen-hub en de per-land-landingspagina's:
 * zo staat de trust-strip en het afwerking-infoblok maar op één plek en kunnen
 * hub en landpagina niet uit elkaar lopen.
 */

/** Zekerheden vlak boven de shop, levertijd voorop. */
export function TrustStrip() {
  return (
    <ul className={styles.trustStrip}>
      <li>
        <Truck size={16} aria-hidden="true" />
        Binnen 5 werkdagen op je mast · buitenland 1,5 week
      </li>
      <li>
        <ShieldCheck size={16} aria-hidden="true" />
        Drukbestand maken wij
      </li>
      <li>
        <Leaf size={16} aria-hidden="true" />
        Biologisch afbreekbaar doek, ASTM-getest
      </li>
      <li>
        <Check size={16} aria-hidden="true" />
        Gratis verzending vanaf &euro;&nbsp;100 incl. btw
      </li>
    </ul>
  );
}

/** Compact afwerking-infoblok onder de shop (mastvlag-afwerking, doorverwijzing). */
export function Afwerking() {
  return (
    <section className={styles.afwerking} aria-labelledby="afwerking-titel">
      <Image
        src="/configurator/afwerking/mastvlag-haken.jpeg"
        alt="Mastzijde van de mastvlag: witte band met haken voor de mastlijn"
        width={220}
        height={220}
        className={styles.afwerkingBeeld}
      />
      <div className={styles.afwerkingTekst}>
        <h2 id="afwerking-titel" className={styles.afwerkingTitel}>
          Zo werken we je vlag af
        </h2>
        <p className={styles.afwerkingBody}>
          Je landenvlag is een mastvlag van biologisch afbreekbaar
          Flag-CiCLO&reg;-doek, rondom afgewerkt. Aan de mastzijde zit een
          stevige band met haken (clips): die klik je zo op de mastlijn. Band en
          garen zijn standaard wit; de kleur van het doek is gewoon je vlag.
        </p>
        <p className={styles.afwerkingBody}>
          Liever koord en lus om vast te knopen, of een zwarte band? Die keuzes
          vind je in de{" "}
          <Link href="/collectie/mastvlag">mastvlag-configurator</Link>.
        </p>
      </div>
    </section>
  );
}
