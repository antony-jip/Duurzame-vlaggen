# Styleguide V5.0 — "Sora Edition"

Complete design system voor **Duurzame-Vlaggen.nl**. Philosophy: **"Bold Disruptor –
Unified Typography"**. Clean + geometrisch, licht (off-white), niet dark, caps alleen op
labels/badges. Bron-van-waarheid voor de UI (Fase 3). Implementeer fonts via `next/font`
(niet Google `<link>`).

## 1. Foundation — Core CSS variables

```css
:root {
  /* ===== COLORS ===== */
  --color-forest: #2C5F4F;        /* Primary actions, trust, stability */
  --color-terracotta: #C66B4E;    /* Energy, conversion, warmth (hover) */
  --color-sage-blue: #5C8A9D;     /* Secondary actions, success */
  --color-copper-rust: #A46B4A;   /* Premium craft — eyebrows only, ~3% */
  --color-sage-purple: #8B7BA8;   /* Personal/metadata — ~5% */
  --color-white: #FFFFFF;
  --color-off-white: #F7F5F2;
  --color-charcoal: #3A3A3A;      /* Body text */
  --color-stone: #8B8D7A;         /* Subtle text */

  /* ===== FONTS (via next/font) ===== */
  --font-eyebrow: 'Bricolage Grotesque', system-ui, sans-serif; /* eyebrow badges ONLY */
  --font-heading: 'Sora', system-ui, sans-serif;
  --font-button: 'Sora', system-ui, sans-serif;
  --font-body: 'Manrope', system-ui, sans-serif;                /* body text ONLY */
  --font-ui: 'Sora', system-ui, sans-serif;

  /* ===== SPACING ===== */
  --space-xs: 8px;  --space-sm: 16px; --space-md: 24px; --space-lg: 32px;
  --space-xl: 48px; --space-2xl: 64px; --space-3xl: 96px; --space-4xl: 128px;

  /* ===== BORDER RADIUS ===== */
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px; --radius-xl: 20px; --radius-2xl: 28px;

  /* ===== SHADOWS (forest-tinted) ===== */
  --shadow-xs: 0 1px 3px rgba(44, 95, 79, 0.08);
  --shadow-sm: 0 2px 8px rgba(44, 95, 79, 0.12);
  --shadow-md: 0 4px 16px rgba(44, 95, 79, 0.15);
  --shadow-lg: 0 8px 24px rgba(44, 95, 79, 0.25);
  --shadow-xl: 0 12px 32px rgba(44, 95, 79, 0.35);
  --shadow-2xl: 0 20px 60px rgba(44, 95, 79, 0.4);
  --shadow-terracotta-md: 0 8px 24px rgba(198, 107, 78, 0.25);
  --shadow-sage-md: 0 8px 24px rgba(92, 138, 157, 0.25);
  --shadow-copper: 0 4px 20px rgba(164, 107, 74, 0.3);
  --shadow-purple: 0 4px 16px rgba(139, 123, 168, 0.2);

  /* ===== Z-INDEX ===== */
  --z-base: 1; --z-dropdown: 100; --z-sticky: 200; --z-overlay: 300; --z-modal: 400; --z-toast: 500;

  /* ===== ANIMATION ===== */
  --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.6, 1);
  --ease-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --duration-fast: 150ms; --duration-base: 300ms; --duration-slow: 500ms;

  /* ===== BREAKPOINTS ===== */
  --breakpoint-sm: 640px; --breakpoint-md: 768px; --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px; --breakpoint-2xl: 1600px;

  /* ===== CONTAINER ===== */
  --container-max: 1600px;
  --container-padding: var(--space-2xl);
}
```

### Opacity scales (per kleur, gebruik naar behoefte)
`forest / terracotta / sage-blue / copper-rust / sage-purple` elk op `04`, `12`, `15`, `20`:
bv. `--forest-3: rgba(44,95,79,0.04)`, `--forest-6: rgba(44,95,79,0.12)`,
`--forest-15: rgba(44,95,79,0.15)`, `--forest-8: rgba(44,95,79,0.2)`. Idem terracotta
`(198,107,78)`, sage-blue `(92,138,157)`, copper-rust `(164,107,74)`, sage-purple `(139,123,168)`.

## 2. Color usage
- **Primary CTA**: bg Forest → hover Terracotta, tekst altijd wit, Sora 800.
- **Secondary CTA**: bg wit, border Forest 6%, hover bg Sage Blue + witte tekst, Sora 800.
- **Tertiary**: transparant, border Terracotta 6%, hover bg Forest + witte tekst, Sora 800.
- **Eyebrow badge**: Copper Rust, Bricolage 700, wit — alleen hero/premium (~3%).
- **Success**: Sage Blue, Sora 700 uppercase. **Personal/metadata**: Sage Purple.
- **Body**: Charcoal. **Subtiel**: Stone. **Links**: Forest → hover Terracotta.
- **Heading-accent**: gradient Terracotta → lichter, 1–2 woorden in hero-titel.

## 3. Typography

Fonts: **Sora** = headings/buttons/UI/forms/badges/stats (~70%); **Manrope** = body/captions
(~25%); **Bricolage Grotesque** = eyebrow-badges only (~5%).

```css
h1,.h1 { font-family: var(--font-heading); font-weight: 800; font-size: clamp(48px,7vw,88px);
  line-height: 1.05; letter-spacing: -0.04em; color: var(--color-charcoal); }
h2,.h2 { font-family: var(--font-heading); font-weight: 700; font-size: clamp(36px,5vw,60px);
  line-height: 1.08; letter-spacing: -0.03em; }
h3,.h3 { font-family: var(--font-heading); font-weight: 600; font-size: clamp(24px,3vw,32px);
  line-height: 1.2; letter-spacing: -0.01em; }
h4,.h4 { font-family: var(--font-heading); font-weight: 600; font-size: 20px; line-height: 1.3; }
.lead,.text-lg { font-family: var(--font-body); font-size: 20px; line-height: 1.6; }
p,.text-base { font-family: var(--font-body); font-size: clamp(16px,1.8vw,18px); line-height: 1.65;
  color: var(--color-charcoal); }
.text-sm { font-family: var(--font-body); font-size: 15px; line-height: 1.5; color: var(--color-stone); }
.caption,.text-xs { font-family: var(--font-body); font-size: 13px; font-weight: 500; color: var(--color-stone); }
.text-ui { font-family: var(--font-ui); font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; }
.text-data { font-family: var(--font-heading); font-size: 28px; font-weight: 800;
  letter-spacing: -0.02em; color: var(--color-forest); }
.text-eyebrow { font-family: var(--font-eyebrow); font-optical-sizing: auto; font-weight: 700;
  font-size: 13px; letter-spacing: 0.03em; }
```

Matrix: Buttons Sora 800 15px · Form labels Sora 700 12px UPPERCASE · Form inputs Sora 500 15px ·
Stat values Sora 800 28px · Stat labels Sora 700 10px UPPERCASE · Small badges Sora 700 11px UPPERCASE ·
Eyebrow Bricolage 700 13px.

## 4. Buttons

```css
.btn { font-family: var(--font-button); font-weight: 800; font-size: 15px; letter-spacing: -0.01em;
  display: inline-flex; align-items: center; gap: 10px; padding: 20px 36px;
  border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); cursor: pointer;
  text-decoration: none; transition: all var(--duration-base) var(--ease-out);
  position: relative; overflow: hidden; border: none; }

.btn-primary { background: var(--color-forest); color: white; }
.btn-primary:hover { background: var(--color-terracotta); color: #fff !important;
  transform: translateY(-3px); box-shadow: var(--shadow-terracotta-md); }
/* Shimmer: ::before gradient sweeps left→right on hover. svg shifts translateX(4px) on hover. */

.btn-secondary { background: white; color: var(--color-forest); border: 3px solid var(--forest-6); }
.btn-secondary:hover { background: var(--color-sage-blue); color: #fff !important;
  border-color: var(--color-sage-blue); transform: translateY(-3px); box-shadow: var(--shadow-sage-md); }

.btn-tertiary { background: transparent; color: var(--color-charcoal); border: 2px solid var(--terracotta-6); }
.btn-tertiary:hover { background: var(--color-forest); color: #fff !important;
  border-color: var(--color-forest); transform: translateY(-2px); box-shadow: var(--shadow-md); }

.btn-sm { font-size: 14px; padding: 14px 24px; border-radius: var(--radius-md); }
.btn-lg { font-size: 16px; padding: 24px 44px; border-radius: var(--radius-xl); }
.btn-full { width: 100%; justify-content: center; }
```
States: `:disabled` → opacity .5, not-allowed, no transform. `.loading` → transparante tekst +
witte spinner (`button-spin` 0.6s). `:focus-visible` → `outline: 3px solid var(--color-forest); outline-offset: 2px`.

## 5. Badges

```css
.badge-eyebrow { background: var(--color-copper-rust); color: #fff; padding: 12px 28px;
  border-radius: 12px; box-shadow: var(--shadow-copper); font-family: var(--font-eyebrow);
  font-weight: 700; font-size: 13px; letter-spacing: 0.03em; /* + pulse-ring ::after */ }
.badge-primary,.badge-success,.badge-personal,.badge-detail,.badge-outline {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
  border-radius: var(--radius-sm); font-family: var(--font-ui); font-weight: 700;
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #fff; }
.badge-primary { background: var(--color-forest); }     /* CSRD/classificatie */
.badge-success { background: var(--color-sage-blue); }  /* verified/in stock */
.badge-personal { background: var(--color-sage-purple); }
.badge-detail  { background: var(--color-sage-purple); font-weight: 600; } /* metadata/specs */
.badge-outline { background: transparent; color: var(--color-stone);
  border: 2px solid var(--forest-6); font-weight: 600; padding: 4px 10px; }
```

## 6. Forms

```css
input[type=text],input[type=email],input[type=tel],input[type=number],input[type=url],textarea,select {
  font-family: var(--font-ui); font-weight: 500; font-size: 15px; letter-spacing: -0.01em;
  color: var(--color-charcoal); width: 100%; padding: var(--space-sm) 20px; background: white;
  border: 2px solid var(--forest-6); border-radius: var(--radius-md);
  transition: all var(--duration-base) var(--ease-out); }
input:focus,textarea:focus,select:focus { outline: none; border-color: var(--color-forest);
  box-shadow: 0 0 0 4px var(--forest-3); }
input:hover:not(:focus) { border-color: var(--forest-8); }
input.error { border-color: #EF4444; box-shadow: 0 0 0 4px rgba(239,68,68,0.1); }
input.success { border-color: var(--color-sage-blue); box-shadow: 0 0 0 4px var(--sage-blue-3); }
input:disabled { background: var(--color-off-white); border-color: var(--forest-3); opacity: .6; }
input::placeholder { color: var(--color-stone); opacity: .6; }

label { display: block; margin-bottom: var(--space-xs); font-family: var(--font-ui);
  font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--color-charcoal); }
label .required { color: #EF4444; margin-left: 2px; }
.helper-text { font-family: var(--font-body); font-size: 13px; color: var(--color-stone); margin-top: 6px; }
.error-text { font-family: var(--font-body); font-size: 13px; color: #EF4444; margin-top: 6px; }
```
Custom checkbox/radio: 20px, border Forest 6%, checked = Forest fill (checkmark / dot).

## 7. Layout

```css
.container { max-width: var(--container-max); margin-inline: auto;
  padding-inline: var(--space-2xl); }
.container-narrow { max-width: 680px; margin-inline: auto; }
.container-medium { max-width: 960px; margin-inline: auto; }
.full-bleed { width: 100vw; margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw); }
```
Spacing scale 8→128px zoals variabelen. Responsive: onder `--breakpoint-md` container-padding terug
naar `var(--space-md)`.

## 8. Animation

```css
@keyframes fade-in-up { from { opacity:0; transform:translateY(30px);} to {opacity:1; transform:translateY(0);} }
@keyframes float { 0%,100% { transform:translateY(0);} 50% { transform:translateY(-8px);} }
@keyframes pulse-ring { 0%,100% { opacity:0; transform:scale(1);} 50% { opacity:.4; transform:scale(1.1);} }
```

## 9. Signature components

**Hero** — 2-koloms grid (`1fr 1fr`), `min-height: 90vh`, off-white/wit, met een subtiele
**tech-grid** achtergrond (`::before`, `linear-gradient` 60px raster, sage-blue/sage-purple 3–4% opacity).
Eyebrow badge + H1 (met 1–2 woorden gradient-accent) + lead + CTA-paar + drijvende stat-cards.

**Stat card** — glassmorphism: `background: rgba(255,255,255,0.95); backdrop-filter: blur(12px);
border: 2px solid var(--forest-6); border-radius: var(--radius-md); box-shadow: var(--shadow-md);
animation: float 4s var(--ease-in-out) infinite`. Stat-label Sora 700 10px UPPERCASE (afwisselend
sage-blue / sage-purple), stat-value Sora 800 28px Forest.

## 10. Distributie
Sora ~70% (headings, buttons, UI, forms, badges, stats) · Manrope ~25% (body/captions/helper) ·
Bricolage ~5% (eyebrow badges only). JetBrains Mono is verwijderd (V5.0).
