import type { ReactNode } from "react";
import styles from "./Hero.module.css";
import { Container } from "./Container";

export interface HeroProps {
  /** Eyebrow badge content (rendered above the title). */
  eyebrow?: ReactNode;
  /** Main heading. Wrap 1–2 words in <span className="accent"> for the gradient. */
  title: ReactNode;
  lead?: ReactNode;
  /** CTA buttons. */
  actions?: ReactNode;
  /** Right-column visual / stat-card cluster. */
  aside?: ReactNode;
}

export function Hero({ eyebrow, title, lead, actions, aside }: HeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <Container className={styles.grid}>
        <div className={styles.content}>
          {eyebrow}
          <h1 id="hero-title" className={styles.title}>
            {title}
          </h1>
          {lead && <p className={`lead ${styles.lead}`}>{lead}</p>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
        {aside && <div className={styles.aside}>{aside}</div>}
      </Container>
    </section>
  );
}
