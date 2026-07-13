# Referentie: live beachflag-configurator (van duurzame-vlaggen.nl)
Door Antony aangeleverd als richting ("hoeft niet precies zo"). Wij herbouwen dit
in de eigen Sora-stijl + CSS-modules + lokaal prijsmodel (geen shadow-DOM component,
geen quote-only flow — wij houden add-to-cart + online betalen).

## Prijsmodel-regels (overnemen in lib/pricing/local-catalog)
- STAFFEL: 1=0% · 5=5% · 10=10% (Meest Gekozen) · 25=15% · 50=20%
- VERZENDING: subtotaal < €150 → €7,50, anders gratis  (nu €8,95/150 in ons model → bijstellen naar €7,50)
- ONTWERPSERVICE: €85 vast (optionele toevoeging)
- SAMENSTELLING (hardware-toeslag p.s.): alleen vlag €0 · vlag+stok €15 · stok+tas €22,50

## Beachflag maten + prijs (p.s., ex btw)
STRAIGHT: 80×220 Small €35 · 65×315 "Medium S" €45 · 80×315 "Medium L" €49 · 90×430 Large €65
SQUARE:   75×200 Small €45 · 75×300 Medium €55 · 75×400 Large €65
(Square heeft GEEN "kleur band"-stap; straight wel: wit/zwart/meegeprint, gratis)

## Accessoires (los bij te bestellen, prijs elk)
kruisvoet zwart €27 · voetplaat 5kg €31 · voetplaat 15kg €70 · parasolvoet zwart €33 ·
parasolvoet wit €40 · grondpen €11 · rotator parasol €8 · metalen standaard €28 ·
grondplug €14 · waterzak grijs €7 · waterzak zwart €8 · rotator voetplaat €8

## UX-patroon (richting)
- Sticky gallery (hoofdbeeld + thumbs) links, config rechts
- Genummerde stappen met BEELDTEGELS: 1 Model · 2 Formaat · 3 Staffel · 4 Samenstelling ·
  5 Mastzijde · 6 Kleur band · 7 Accessoires · Ontwerpservice-toggle
- Sticky donkere prijsbalk onderaan: live totaal, "je bespaart", excl. btw, CTA
- Info-"i" per tegel opent detail-popup

## Bron
Volledige originele component-code: docs/configurator-ref/beachflag-live-config.html
