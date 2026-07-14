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

/* ---- Vlagtype-pictogrammen — rustige merkeigen producticonen ---- */

export function FlagBanier({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      {/* Staande rechthoekige banier langs de mast, met een lichte golf
         in de onderrand. */}
      <path d="M6 2v20" />
      <path d="M6 3h11" />
      <path d="M17 3v13.4c-3.7 1.3-7.3-1.3-11 0" />
      <path d="M4 22h4" />
    </svg>
  );
}

export function FlagMast({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M5 2v20" />
      <path d="M5 4c4-1.6 6 1.6 10 0 1.6-.6 3-.6 4 0v7c-1-.6-2.4-.6-4 0-4 1.6-6-1.6-10 0" />
      <path d="M3 22h4" />
    </svg>
  );
}

export function FlagBeach({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M7 22c0-9 .5-16 3-20" />
      <path d="M10 2c6 1 8 7 7 15-2.5-2-5-2.5-8-2" />
      <path d="M5 22h5" />
    </svg>
  );
}

export function FlagGevel({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      {/* Muur, schuine uithouder, en een banier die eraan hangt. */}
      <path d="M5 2v20" />
      <path d="M5 9l11-4" />
      <path d="M16 5v9.6c-1.5-.9-3-.9-4.4 0V6.6" />
    </svg>
  );
}

export function FlagPole({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 22V4" />
      <circle cx="12" cy="3" r="1" />
      <path d="M8 22h8" />
      <path d="M10 19h4" />
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
