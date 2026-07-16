"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { Button, Card, ArrowRight } from "@/components/ui";
import type { ReorderCartLine } from "@/lib/orders/reorder";
import styles from "./reorder.module.css";

/**
 * Client-helft van de herbestelpagina: toont de gereconstrueerde regels (met
 * hun eerdere ontwerpen) en zet ze in één klik in de mand. Daarna volgt de
 * klant de normale checkout, waar elk ontwerp nog te vervangen of te
 * herverdelen is.
 */

export interface ReorderLine {
  reorderable: boolean;
  name: string;
  sizeLabel: string | null;
  amount: number;
  designs: Array<{ fileUrl: string | null; fileName: string | null; quantity: number }>;
  cartItem: ReorderCartLine | null;
}

export function ReorderClient({ lines }: { lines: ReorderLine[] }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const orderable = lines.filter(
    (l): l is ReorderLine & { cartItem: ReorderCartLine } =>
      l.reorderable && l.cartItem !== null,
  );
  const skipped = lines.filter((l) => !l.reorderable);

  function addAll() {
    for (const line of orderable) addItem(line.cartItem);
    setAdded(true);
    router.push("/winkelwagen");
  }

  return (
    <div className={styles.lines}>
      {lines.map((line, i) => (
        <Card key={i} className={styles.line} elevation="default">
          <div className={styles.lineHead}>
            <span className={styles.lineName}>{line.name}</span>
            <span className={styles.lineMeta}>
              {line.sizeLabel ? `${line.sizeLabel} · ` : ""}
              {line.amount}×
            </span>
          </div>
          {line.reorderable ? (
            line.designs.length > 0 && (
              <ul className={styles.designs}>
                {line.designs.map((d, j) => (
                  <li key={j} className={styles.design}>
                    {d.fileUrl && /\.(jpe?g|png)$/i.test(d.fileName ?? d.fileUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={d.fileUrl}
                        alt={`Ontwerp ${d.fileName ?? ""}`}
                        className={styles.designThumb}
                      />
                    ) : (
                      <span className={styles.designChip}>
                        {d.fileUrl ? "PDF" : "Geen bestand"}
                      </span>
                    )}
                    <span className={styles.designLabel}>
                      {d.fileName ?? (d.fileUrl ? "Ontwerp" : "Zonder bestand")} ·{" "}
                      {d.quantity}×
                    </span>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <p className={styles.skippedNote}>
              Deze regel kunnen we niet automatisch opnieuw bestellen. Stel hem
              opnieuw samen via de collectie, of mail ons.
            </p>
          )}
        </Card>
      ))}

      {orderable.length > 0 ? (
        <Button size="lg" icon={<ArrowRight />} onClick={addAll} disabled={added}>
          {added
            ? "Toegevoegd…"
            : `Zet ${orderable.length === 1 ? "deze vlag" : "alles"} in mijn winkelmand`}
        </Button>
      ) : (
        skipped.length > 0 && (
          <Button as="a" href="/collectie" size="lg" icon={<ArrowRight />}>
            Naar de collectie
          </Button>
        )
      )}
    </div>
  );
}
