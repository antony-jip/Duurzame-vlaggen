import styles from "./bladeren.module.css";

/**
 * Dwarrelende blaadjes voor een geslaagde bestelling.
 *
 * Confetti van plastic snippers past niet bij een winkel in biologisch
 * afbreekbaar doek; blaadjes wél. Het is dezelfde beloning, maar dan in het
 * verhaal van het merk: het doek keert terug naar de natuur.
 *
 * Bewust géén client-component en geen bibliotheek. De blaadjes krijgen hun
 * "toevallige" plek uit een deterministische ruisfunctie in plaats van
 * Math.random(): server en client renderen hetzelfde (geen hydration-mismatch),
 * er is geen effect nodig, en het werkt ook als de pagina in een achtergrondtab
 * wordt geopend — een eerdere variant met requestAnimationFrame deed daar niets,
 * want die vuurt niet in een tab die verborgen is.
 *
 * Reduced motion regelt globals.css al: animaties krijgen dan 0.001ms en de
 * animatie eindigt op `opacity: 0`, dus de blaadjes zijn meteen weg in plaats
 * van als streep boven in beeld te blijven plakken.
 */

/** Bladgroen en herfst: overwegend groen, met wat koper ertussen. */
const KLEUREN = [
  "var(--color-forest)",
  "var(--color-sage-blue)",
  "var(--color-forest)",
  "var(--color-copper-rust)",
  "var(--color-sage-blue)",
  "var(--color-terracotta)",
];

const AANTAL = 34;

/**
 * Deterministische pseudo-ruis: 0..1, stabiel per (index, zaad). Dezelfde truc
 * als in shaders; genoeg wanorde om een val natuurlijk te laten ogen, zonder
 * echte willekeur.
 */
function ruis(i: number, zaad: number): number {
  const x = Math.sin(i * 12.9898 + zaad * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function Bladeren() {
  return (
    <div className={styles.root} aria-hidden="true">
      {Array.from({ length: AANTAL }, (_, i) => {
        const grootte = 10 + ruis(i, 5) * 9;
        return (
          // Buitenste span valt en zwiept; binnenste tolt. Twee lagen, omdat één
          // animatie niet tegelijk kan vallen en om z'n eigen as kan draaien.
          <span
            key={i}
            className={styles.baan}
            style={
              {
                left: `${ruis(i, 1) * 100}%`,
                animationDelay: `${ruis(i, 2) * 2.2}s`,
                animationDuration: `${5.5 + ruis(i, 3) * 3.5}s`,
                "--zwiep": `${28 + ruis(i, 4) * 46}px`,
              } as React.CSSProperties
            }
          >
            <span
              className={styles.blad}
              style={
                {
                  width: `${grootte}px`,
                  height: `${grootte}px`,
                  background: KLEUREN[i % KLEUREN.length],
                  animationDelay: `${ruis(i, 2) * 2.2}s`,
                  animationDuration: `${1.8 + ruis(i, 6) * 2.2}s`,
                } as React.CSSProperties
              }
            />
          </span>
        );
      })}
    </div>
  );
}
