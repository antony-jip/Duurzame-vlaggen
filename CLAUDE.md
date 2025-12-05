# CLAUDE.md - Duurzame-Vlaggen.nl Development Guide

> **Purpose:** Central reference for AI assistants working on this codebase
> **Version:** 1.0 | **Last Updated:** December 2024

---

## Project Overview

**Duurzame-Vlaggen.nl** is a Dutch B2B supplier of biodegradable flags using **Flag-Ciclo technology** (based on CiCLO®).

```
Type:        WordPress/Elementor website
Language:    Dutch (Netherlands)
Target:      B2B (large enterprises, SMEs, municipalities, associations)
USP:         96% biodegradable flags, 0% microplastics, CSRD compliant
```

### Key Differentiators
- **Biodegradable** (not recycled PET) - 96% decomposes in 2-3 years
- **Zero microplastic residue** after decomposition
- **CSRD Compliant** - meets ESRS E2-5 reporting requirements
- **Same quality** as traditional polyester (3-4 month lifespan, 2-year UV resistance)

---

## Quick Reference

### Brand Voice
```
WE ARE:                         WE ARE NOT:
├─ Data-Driven                  ├─ Hippie-Green ("Save the planet! 🌍💚")
├─ Direct                       ├─ Corporate-Boring
├─ Expert                       ├─ Tech-Arrogant
├─ Innovative                   ├─ Greenwashing
└─ Accessible (use "jij")       └─ Vague
```

### Critical Rules

| Rule | Description |
|------|-------------|
| **Button Hover = WHITE** | `color: white !important;` on ALL button hovers |
| **"jij" Form** | Always lowercase "je/jouw" (except sentence start) |
| **No Greenwashing** | Use specific data, not vague claims |
| **Modular Components** | One component per file, ready for Elementor |
| **Minimum 3 Images** | Per component, with descriptive placeholders |

---

## Design System

### Colors

```css
/* Primary */
--color-forest: #2C5F4F;        /* Trust, sustainability (35%) */
--color-terracotta: #C66B4E;    /* Energy, conversion (10%) */
--color-sage-blue: #5C8A9D;     /* Service, success (10%) */
--color-copper-rust: #A46B4A;   /* Premium, craft (2-3%) */
--color-sage-purple: #8B7BA8;   /* Personal, user content (5%) */

/* Neutrals */
--color-white: #FFFFFF;
--color-off-white: #F7F5F2;
--color-charcoal: #3A3A3A;
--color-stone: #8B8D7A;
```

### Color Usage

| Color | Use For | Never For |
|-------|---------|-----------|
| Forest Green | Primary buttons, CSRD badges, compliance | Urgency, personal content |
| Terracotta | Button hovers, urgency, deadlines | Default buttons, trust badges |
| Sage Blue | Secondary buttons (hover), success states, service | Primary conversion |
| Sage Purple | User profiles, favorites, metadata | System features |
| Copper Rust | Eyebrow badges (hero only), premium | Daily UI, buttons |

### Typography

```css
/* Fonts */
--font-eyebrow: 'Bricolage Grotesque';  /* Eyebrow badges ONLY */
--font-heading: 'Sora';                  /* Headings, buttons, UI */
--font-body: 'Manrope';                  /* Body text ONLY */
```

| Element | Font | Weight | Size | Transform |
|---------|------|--------|------|-----------|
| Eyebrow Badge | Bricolage Grotesque | 700 | 13px | none |
| H1 (Hero) | Sora | 800 | 48-88px clamp | none |
| H2 (Section) | Sora | 700 | 36-60px clamp | none |
| H3 | Sora | 600 | 24-32px clamp | none |
| Buttons | Sora | 800 | 15px | none |
| Body Text | Manrope | 400 | 16-18px clamp | none |
| Form Labels | Sora | 700 | 12px | UPPERCASE |
| Badges | Sora | 700 | 11px | UPPERCASE |

### Spacing Scale

```css
--space-xs: 8px;    --space-sm: 16px;   --space-md: 24px;
--space-lg: 32px;   --space-xl: 48px;   --space-2xl: 64px;
--space-3xl: 96px;  --space-4xl: 128px;
```

### Border Radius

```css
--radius-sm: 6px;   --radius-md: 10px;  --radius-lg: 14px;
--radius-xl: 20px;  --radius-2xl: 28px;
```

---

## Component Development

### Structure Rules

```
ALWAYS:
├─ Self-contained components (one per file)
├─ Include <style> block with all CSS
├─ Use CSS variables
├─ Include responsive breakpoints
├─ Ready to paste into Elementor HTML widget

NEVER:
├─ Complete HTML pages with <html>, <head>, <body>
├─ Full page layouts in one file
├─ External CSS dependencies
```

### Component Template

```html
<!-- COMPONENT: [Name] -->
<section class="[component-name]" aria-labelledby="[unique-id]">
    <style>
        .[component-name] {
            /* Include ALL CSS variables needed */
            --color-forest: #2C5F4F;
            --color-terracotta: #C66B4E;
            /* ... */
        }
        /* Component styles */
        /* Responsive styles */
    </style>

    <div class="[component-name]-container">
        <h2 id="[unique-id]"><!-- Heading --></h2>
        <!-- Content -->
    </div>
</section>
```

### Image Placeholders

```html
<!-- Format -->
https://placehold.co/[WIDTH]x[HEIGHT]/[BG-COLOR]/[TEXT-COLOR]?text=[DESCRIPTION]

<!-- Example -->
<img
    src="https://placehold.co/1200x600/2C5F4F/FFFFFF?text=Hero:+Biodegradable+flag+on+office"
    alt="Biologisch afbreekbare vlag aan modern kantoorgebouw"
    width="1200"
    height="600"
    loading="lazy"
>
```

---

## Button System

### Primary Button (Forest → Terracotta)

```css
.btn-primary {
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    font-size: 15px;
    padding: 20px 36px;
    background: #2C5F4F;
    color: white;
    border: none;
    border-radius: 14px;
}

.btn-primary:hover {
    background: #C66B4E;
    color: white !important; /* CRITICAL */
    transform: translateY(-3px);
}
```

### Secondary Button (White → Sage Blue)

```css
.btn-secondary {
    background: white;
    color: #2C5F4F;
    border: 3px solid rgba(44, 95, 79, 0.12);
}

.btn-secondary:hover {
    background: #5C8A9D;
    color: white !important; /* CRITICAL */
}
```

### Decision Tree

```
Main conversion action?     → .btn-primary (Forest → Terracotta)
Alternative/secondary?      → .btn-secondary (White → Sage Blue)
Low priority/tertiary?      → .btn-tertiary (Transparent → Forest)
```

---

## Badge System

| Badge Type | Color | Font | Use Case |
|------------|-------|------|----------|
| `.badge-eyebrow` | Copper Rust | Bricolage Grotesque | Hero sections, "Flag-Ciclo Technology" |
| `.badge-primary` | Forest Green | Sora uppercase | CSRD, "Biologisch afbreekbaar" |
| `.badge-success` | Sage Blue | Sora uppercase | "Verified", delivery time, success |
| `.badge-personal` | Sage Purple | Sora uppercase | "Mijn Account", favorites |

---

## Content Guidelines

### Forbidden Words (Greenwashing)

```
NEVER USE:              USE INSTEAD:
- "Eco-friendly"        - "96% lost volledig op in 2-3 jaar"
- "Groen"               - "0% microplastic residue"
- "Milieuvriendelijk"   - "Voldoet aan ESRS E2-5"
- "Duurzaam" (vague)    - "Biologisch afbreekbaar volgens ASTM D6866"
- "Natuurlijk"
```

### Copy Formulas

```
HEADLINES:    [Problem solved] + [Concrete promise]
              "Vlaggen die verdwijnen. Zero plastic."

CTA BUTTONS:  [Verb] + [Concrete result]
              ✅ "Bereken je besparing"
              ❌ "Ontdek meer" / "Klik hier"
```

### Key Messages (Use 2 of 3)

1. **Zero Microplastic** - "0% microplastic residue. Geen sporen."
2. **CSRD Compliant** - "Voldoet aan ESRS E2-5 rapportage-eisen."
3. **Biodegradable** - "96% lost volledig op in 2-3 jaar."

---

## Technical Product Facts

### Verified Claims ONLY

```
Lifespan:        3-4 months in use (same as polyester)
UV Resistance:   2 years
Decomposition:   96% in 2-3 years (NOT 100%)
Environments:    Soil, compost, seawater, sewage, landfill
Result:          No microplastics - only CO2, water, biomass
Price:           Few euros more than traditional
Delivery:        ~3 business days
```

### Certifications

- OEKO-TEX® ECO PASSPORT
- REACH Compliant
- ASTM D5988 (soil): 91.1% decomposition
- ASTM D5511 (landfill): 91.1%
- ASTM D5210 (sewage): 89.9%
- ASTM D6691 (seawater): Accelerated decomposition

### Never Claim

- "700,000 microplastic particles" (no own data)
- "100% biodegradable" (it's 96%)
- "Compostable" (no certification)
- "CSRD-certified" (CSRD is reporting obligation, not certification)

---

## SEO Requirements

### Semantic HTML

```html
<!-- Always use semantic elements -->
<section aria-labelledby="section-id">
<article>
<nav>
<header>, <footer>, <main>
```

### Heading Rules

1. **One H1 per page**
2. **Never skip levels** (H1 → H2 → H3, never H1 → H3)
3. **Keywords in headings** (naturally)

### Images

```html
<!-- Always include -->
<img
    src="..."
    alt="Descriptive alt text in Dutch"
    width="1200"
    height="600"
    loading="lazy"
>
```

### Links

```html
<!-- Never generic -->
❌ <a href="/csrd/">Klik hier</a>
✅ <a href="/csrd/">Ontdek hoe Flag-Ciclo helpt bij CSRD-compliance</a>
```

---

## URL Structure

```
/                           Homepage
/bestel/                    Products
/bestel/mastvlaggen/        Mast flags
/voor-bedrijven/            B2B landing
/voor-gemeenten/            Municipalities
/materiaal/                 Material info
/csrd/                      CSRD hub
/bereken-besparing/         Calculator tool
/blog/                      Blog
```

---

## Development Checklist

### Component Checklist
- [ ] Self-contained (no external dependencies)
- [ ] `<style>` block with all CSS
- [ ] Placeholders with placehold.co + description
- [ ] Brand colors for placeholders
- [ ] Minimum 3 images
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Buttons with white text on hover
- [ ] Hover states defined
- [ ] CSS variables used
- [ ] Brand fonts correct
- [ ] Semantic HTML
- [ ] ARIA labels where needed
- [ ] Descriptive alt texts
- [ ] Copy-paste ready for Elementor

### SEO Checklist
- [ ] One H1 per page
- [ ] Heading hierarchy correct
- [ ] All images have alt text
- [ ] Descriptive anchor text on links
- [ ] Width/height on images
- [ ] Lazy loading on below-fold images

---

## Golden Rules Summary

```
1. DATA > EMOTION         → "96% lost volledig op" not "Goed voor de natuur"
2. BUTTON HOVER = WHITE   → color: white !important;
3. MODULAR COMPONENTS     → One file = one component = paste into Elementor
4. TYPOGRAPHY             → Sora for everything except body (Manrope) and eyebrow (Bricolage)
5. NO GREENWASHING        → Specific, measurable, verifiable
6. "JIJ" FORM             → Lowercase "je/jouw" always
7. SEMANTIC HTML          → <section>, <article>, aria-labels
8. MINIMUM 3 IMAGES       → Per component with descriptive placeholders
```

---

**Brand Positioning:** "Bold Disruptor - Data-driven. Direct. Menselijk."
