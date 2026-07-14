"use client";

/**
 * Productgalerij met lightbox.
 *
 * Toont het hero-beeld (in de organische wapper-vorm) plus de thumbnailrij.
 * Elk beeld is klikbaar en opent een schermvullende lightbox waarin je met
 * pijltjes/klik door alle beelden bladert. Puur weergave — geen bestellogica.
 */

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { ComponentType } from "react";
import styles from "./product.module.css";
import {
  FlagBanier,
  FlagMast,
  FlagBeach,
  FlagGevel,
  FlagPole,
  Close,
  ArrowRight,
} from "@/components/ui";
import type { ProductImage } from "@/lib/catalog/products";

const FLAG_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  baniervlag: FlagBanier,
  mastvlag: FlagMast,
  beachvlag: FlagBeach,
  gevelvlag: FlagGevel,
  vlaggenmast: FlagPole,
};

export function ProductGallery({
  heroImage,
  thumbs,
  slug,
  accent,
  accentClass,
}: {
  heroImage: ProductImage;
  thumbs: ProductImage[];
  slug: string;
  accent: string;
  /** CSS-module klasse voor het accent-gradientvlak achter de hero. */
  accentClass: string;
}) {
  const images = [heroImage, ...thumbs];
  const FlagIcon = FLAG_ICONS[slug] ?? FlagMast;

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isOpen = openIndex !== null;

  const close = useCallback(() => setOpenIndex(null), []);
  const go = useCallback(
    (delta: number) =>
      setOpenIndex((i) =>
        i === null ? i : (i + delta + images.length) % images.length,
      ),
    [images.length],
  );

  // Toetsenbord: Esc sluit, pijltjes bladeren. Lock body-scroll terwijl open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close, go]);

  const current = openIndex !== null ? images[openIndex] : null;

  return (
    <>
      {/* Hero-beeld in de wapper-vorm — klikbaar naar de lightbox. */}
      <button
        type="button"
        className={`${styles.visual} ${accentClass}`}
        onClick={() => setOpenIndex(0)}
        aria-label={`Vergroot: ${heroImage.alt}`}
      >
        <span className={styles.accentChip} data-accent={accent} aria-hidden="true">
          <FlagIcon size={30} />
        </span>
        <span className={styles.visualZoom} aria-hidden="true">⤢</span>
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          fill
          priority
          sizes="(max-width: 860px) 100vw, 50vw"
          className={styles.photo}
        />
      </button>

      {thumbs.length > 0 && (
        <div className={styles.thumbs}>
          {thumbs.map((image, i) => (
            <button
              key={image.src}
              type="button"
              className={styles.thumb}
              onClick={() => setOpenIndex(i + 1)}
              aria-label={`Vergroot: ${image.alt}`}
            >
              <span className={styles.thumbZoom} aria-hidden="true">⤢</span>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 860px) 33vw, 16vw"
                className={styles.photo}
              />
            </button>
          ))}
        </div>
      )}

      {current && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          onClick={close}
        >
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={close}
            aria-label="Sluiten"
          >
            <Close size={24} />
          </button>

          {images.length > 1 && (
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="Vorige"
            >
              <ArrowRight size={22} />
            </button>
          )}

          <figure
            className={styles.lightboxFigure}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.lightboxImgWrap}>
              <Image
                src={current.src}
                alt={current.alt}
                fill
                sizes="90vw"
                className={styles.lightboxImg}
              />
            </div>
            <figcaption className={styles.lightboxCaption}>
              {current.alt}
              {images.length > 1 && (
                <span className={styles.lightboxCounter}>
                  {(openIndex ?? 0) + 1} / {images.length}
                </span>
              )}
            </figcaption>
          </figure>

          {images.length > 1 && (
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxNext}`}
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="Volgende"
            >
              <ArrowRight size={22} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
