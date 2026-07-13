# Referentie: gevelvlag-configurator (van duurzame-vlaggen.nl)
STATUS: voor LATER bouwen. In eigen huisstijl + lokaal prijsmodel (geen quote-only).

## Formaten + prijs (ex btw, per stuk)
100 x 70 cm (Gevelvlag) = €17,50
150 x 100 cm (Gevelvlag) = €29,50   ← default
200 x 100 cm (Baniervlag) = €39,50
225 x 150 cm (Grote Gevelvlag) = €59,50
EIGEN AFMETING: prijs = max(m² × €13,50 ; €20) per stuk

## Regels
STAFFEL: 1/5/10/25/50 → 0/5/10/15/20% (10 st = "Meest Gekozen")
VERZENDING: subtotaal < €150 → €7,50, anders gratis
ONTWERPSERVICE: €85 vast
AANLEVEREN: +2 cm (1 cm afloop rondom), min 150 DPI, liefst vector (PDF/AI/EPS)

## Opties + illustraties (voor optie-beeldkaarten, taak #12)
Mastzijde:  Links  → 2025/12/Mastzijde-links.webp
            Rechts → 2025/12/Mastzijde-rechts.webp
Afwerking:  Koord/Lus → 2025/12/Met-band-koord-en-lus.jpeg
Kleur band: Wit   → 2025/12/Witte-lus-en-koord.jpeg
            Zwart → 2025/12/Zwarte-lus-en-koord.jpeg
(Basis-URL: https://duurzame-vlaggen.nl/wp-content/uploads/)

## UX-patroon (richting)
- Sticky gallery (hoofdbeeld + 2 thumbs), detail-overlay per optie ("i" → grote foto)
- Config: 1 Formaat (dropdown + eigen afmeting) · 2 Staffel · 3 Mastzijde · 4 Afwerking · 5 Kleur · Ontwerpservice-toggle
- Sticky glass-prijsbalk met totaal + "je bespaart" + geanimeerd prijs-tellertje
- Aanlever-guidance-popup met bleed-visual (+1cm rondom)
- Live "vandaag besteld, <datum> in huis"-teller, localStorage-herstel van keuzes/formulier

## Bron
Volledige component-code aangeleverd door Antony in de chat (gevelvlag-configurator).
