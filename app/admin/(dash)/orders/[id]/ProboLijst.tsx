import styles from "../../admin.module.css";
import { beschrijfProboOptie, type ProboOption } from "@/lib/catalog/probo-mapping";
import type { Json } from "@/lib/db/types";

/**
 * Het inkooplijstje per orderregel: wát je bij Probo moet aanklikken.
 *
 * We bestellen met de hand via het Probo-portaal (de API-koppeling is weg, zie
 * commit 3d7727a). `order_items.configuration` is daarvoor de bron. Die stond
 * hier als kale JSON-dump in de tabel, en dan zit je codes te ontcijferen
 * terwijl je aan het bestellen bent.
 *
 * `configuration` is JSONB en komt oorspronkelijk uit een client-payload, dus
 * alles wordt defensief uitgelezen: een oude of half-gevulde regel mag de
 * orderpagina niet slopen.
 */

interface Uitgelezen {
  code: string | null;
  sizeLabel: string | null;
  opties: ProboOption[];
  unmapped: Array<{ label: string; value: string }>;
  selections: Array<{ label: string; value: string }>;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Json-arrays via `unknown[]` binnenhalen; `Json` laat zich niet versmallen. */
function rijen(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function lees(configuration: Json | null): Uitgelezen {
  const c: Record<string, unknown> = isObject(configuration) ? configuration : {};

  const opties: ProboOption[] = rijen(c.options)
    .filter(isObject)
    .map((o) => ({
      code: String(o.code ?? ""),
      value: typeof o.value === "string" || typeof o.value === "number" ? o.value : undefined,
    }));

  const unmapped = rijen(c.unmapped)
    .filter(isObject)
    .map((u) => ({ label: String(u.label ?? ""), value: String(u.value ?? "") }));

  const selections = isObject(c.selections)
    ? Object.entries(c.selections).map(([label, value]) => ({ label, value: String(value ?? "") }))
    : [];

  return {
    code: typeof c.code === "string" ? c.code : null,
    sizeLabel: typeof c.sizeLabel === "string" ? c.sizeLabel : null,
    opties,
    unmapped,
    selections,
  };
}

export function ProboLijst({
  configuration,
  aantal,
}: {
  configuration: Json | null;
  aantal: number;
}) {
  const u = lees(configuration);

  if (!u.code && u.opties.length === 0) {
    return <span className={styles.muted}>Geen configuratie op deze regel.</span>;
  }

  return (
    <div className={styles.probo}>
      <div className={styles.proboKop}>
        <div>
          <span className={styles.proboLabel}>Probo-product</span>
          <span className={styles.proboCode}>{u.code ?? "onbekend"}</span>
        </div>
        <div>
          <span className={styles.proboLabel}>Maat</span>
          <span className={styles.proboMaat}>{u.sizeLabel ?? "zie opties"}</span>
        </div>
        <div>
          <span className={styles.proboLabel}>Aantal</span>
          <span className={styles.proboMaat}>{aantal}×</span>
        </div>
      </div>

      <span className={styles.proboLabel}>Deze opties aanzetten</span>
      <ul className={styles.proboOpties}>
        {u.opties.map((o, i) => (
          <li key={`${o.code}-${i}`} className={styles.proboOptie}>
            <span className={styles.proboOptieTekst}>{beschrijfProboOptie(o)}</span>
            <code className={styles.proboOptieCode}>
              {o.value === undefined ? o.code : `${o.code}=${o.value}`}
            </code>
          </li>
        ))}
      </ul>

      {u.unmapped.length > 0 && (
        <div className={styles.proboHand}>
          <span className={styles.proboHandKop}>Zelf regelen — zit niet in de Probo-order</span>
          <ul className={styles.proboHandLijst}>
            {u.unmapped.map((s) => (
              <li key={s.label}>
                <strong>{s.label}:</strong> {s.value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {u.selections.length > 0 && (
        <details className={styles.proboKlant}>
          <summary>Wat de klant koos</summary>
          <ul className={styles.proboHandLijst}>
            {u.selections.map((s) => (
              <li key={s.label}>
                <strong>{s.label}:</strong> {s.value}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
