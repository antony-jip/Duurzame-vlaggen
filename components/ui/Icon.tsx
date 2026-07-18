import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(size: number, props: SVGProps<SVGSVGElement>) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...props,
  };
}

export function ArrowRight({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function ChevronDown({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function Check({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Factuur/document — omgevouwen hoek, met een paar tekstregels. */
export function Document({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

export function Leaf({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  );
}

export function Recycle({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
      <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
      <path d="m14 16-3 3 3 3" />
      <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
      <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" />
      <path d="m13.378 9.633 4.096 1.098 1.097-4.096" />
    </svg>
  );
}

export function ShieldCheck({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function Truck({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  );
}

export function Droplet({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 2.7c3.5 4 5.5 6.7 5.5 9.6a5.5 5.5 0 0 1-11 0c0-2.9 2-5.6 5.5-9.6Z" />
    </svg>
  );
}

export function NoEntry({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function Menu({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </svg>
  );
}

export function Close({ size = 24, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function Bag({ size = 22, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

/* ---- Vlagtype-pictogrammen — merkeigen producticonen ----
 *
 * Elk vlagtype heeft een eigen SILHOUET, want op 24px is de omtrek het enige
 * dat leest: banier staand aan een dwarsstok, mastvlag liggend en wapperend,
 * beachvlag de veervorm, gevelvlag schuin uit de muur, vlaggenmast kaal.
 * Vijf varianten van hetzelfde vlaggetje zijn hier eerder vijf keer niks.
 *
 * Het DOEK is gevuld, de drager blijft lijn. Dat is de taal van het logo zelf:
 * een massief wit vlagsilhouet op een gekleurd vlak. Een doek is stof, geen
 * draadframe — en tegen Sora 800 ernaast verliest een haarlijn het.
 *
 * `data-cloth` markeert het doek en `data-mast` de drager. Daarmee kan een
 * consument (de mega-menutegel) alleen het doek animeren; overal elders staan
 * de iconen stil. Alles blijft op currentColor, zodat ze in elke context werken.
 */

export function FlagBanier({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      {/* Staande banier: het doek zit met een tunnel om de MAST, dus aan de
         zijkant vast — niet aan een dwarsstok. Vandaar ook de optie
         "Mastzijde: links/rechts" in de catalogus. Smal en hoog (100×400),
         alleen de vrije onderrand golft.

         Geen voet: je koopt de vlag, niet de mast. De mast loopt door tot
         buiten beeld, want hij staat in de grond en niet op een standaard. */}
      <path data-mast="" d="M6 2v20" />
      <path
        data-cloth=""
        fill="currentColor"
        d="M6.6 3.4H13v13.2c-2.1 1.5-4.3-1.4-6.4.2Z"
      />
    </svg>
  );
}

export function FlagMast({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      {/* Mastvlag: liggend doek dat in twee bogen van de mast af wappert.
         Geen voet — de mast is een apart product (zie FlagPole). */}
      <path data-mast="" d="M5 2v20" />
      <path data-cloth="" fill="currentColor" d="M5 3.6c3.5-2.2 7 2.2 10.5 0V11c-3.5 2.2-7-2.2-10.5 0Z" />
    </svg>
  );
}

export function FlagBeach({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      {/* Beachvlag: de gebogen veervorm, het enige type met een kromme stok.
         Geen voet: kruisvoet, grondpen en waterzak zijn accessoires, en je kunt
         de vlag ook los kopen ("Alleen vlag"). */}
      <path data-mast="" d="M7 22c0-9 .6-15.6 3.2-20" />
      <path
        data-cloth=""
        fill="currentColor"
        d="M10.2 2.4c5.4 2.6 6.6 9 4.8 15.3-2.9-1.8-6-2.1-8-1.6.4-6.4 1.3-10.2 3.2-13.7Z"
      />
    </svg>
  );
}

export function FlagGevel({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      {/* Gevelvlag: muur met schuine uithouder, doek hangt er schuin aan. */}
      <path data-mast="" d="M4 2v20" />
      <path data-mast="" d="m4 8.4 11.4-4.1" />
      <path data-cloth="" fill="currentColor" d="m7.3 7.2 7.7-2.8v9.7c-2.6 1.6-5.1-1-7.7.6Z" />
    </svg>
  );
}

export function FlagPole({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      {/* Vlaggenmast: het product is de mast zelf — knop, voet, en een klein
         doek aan de val (dat in het menu de mast in hijst). */}
      <circle data-mast="" cx="12" cy="2.9" r="1.1" />
      <path data-mast="" d="M12 21V4.4" />
      <path data-mast="" d="M8 21.5h8" />
      <path data-mast="" d="m10.2 21.5 1-2.6h1.6l1 2.6" />
      <path
        data-cloth=""
        fill="currentColor"
        d="M12.6 6.2c1.6-.9 3.2.9 4.8 0v3.6c-1.6.9-3.2-.9-4.8 0Z"
      />
    </svg>
  );
}

export function User({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
