/**
 * De onderbouwing onder elke afbreekbaarheidsclaim op de site — één bron.
 *
 * Isomorf (geen `server-only`/`use client`): de claimpagina rendert hiermee,
 * het materiaalpaspoort (PDF) drukt hiermee af, en de contentpagina's citeren
 * eruit. Eén tabel, zodat een cijfer nooit op twee plekken uiteen kan lopen.
 *
 * WAAROM DIT BESTAAT
 * EU-richtlijn 2024/825 (Empowering Consumers) geldt vanaf 27 september 2026 en
 * noemt "biologisch afbreekbaar" expliciet als generieke milieuclaim die
 * verboden is zonder onderbouwing. De ACM handhaaft hier al op via de Leidraad
 * Duurzaamheidsclaims. De richtlijn verbiedt geen afbreekbaarheidsclaims, alleen
 * KALE claims: met testmethode, omstandigheden, percentage en termijn erbij is
 * het geen claim meer maar een meting.
 *
 * Praktische regel voor wie hier iets aan verandert: een percentage uit dit
 * bestand mag nooit los in de copy staan. Altijd met de omgeving en de termijn
 * erbij, en met een link naar `/afbreekbaarheid` op dezelfde pagina.
 *
 * WAT CiCLO WEL EN NIET DOET
 * CiCLO voegt biologisch afbreekbare domeinen toe aan de polyestervezel,
 * waardoor micro-organismen de vezel als voedsel herkennen. Het versnelt dus de
 * AFBRAAK van vezels die zijn afgegeven. Het vermindert de AFGIFTE van vezels
 * niet. Claims in de trant van "x% minder microplastics" of "0% microplastics"
 * zijn daarom onjuist en horen niet op de site.
 */

/** Eén ASTM-testuitkomst voor Flag-CiCLO, met de onbehandelde referentie. */
export interface AfbraakTest {
  /** Volledige normaanduiding, zoals CiCLO hem rapporteert. */
  norm: string;
  /** Korte normcode voor tabelkoppen. */
  code: string;
  /** De geteste omgeving, in mensentaal. */
  omgeving: string;
  /** Wat die omgeving in de praktijk voorstelt. */
  toelichting: string;
  /** Testduur in dagen, zoals gerapporteerd. */
  dagen: number;
  /** Testduur in mensentaal — gebruik dit in klantcopy, nooit de dagen. */
  duur: string;
  /** Afbraakpercentage van het behandelde doek. */
  afbraakPct: number;
  /** Idem voor onbehandeld polyester, of null als er geen afbraak optrad. */
  referentiePct: number | null;
}

/**
 * De vier ASTM-uitkomsten van CiCLO, in aflopende volgorde van afbraak.
 *
 * Zeewater staat vooraan: dat is de hoogste uitkomst én de omgeving waar de
 * microplasticvraag vandaan komt.
 */
export const AFBRAAK_TESTS: readonly AfbraakTest[] = [
  {
    norm: "ASTM D6691-17",
    code: "D6691",
    omgeving: "Zeewater",
    toelichting: "Getest met echte mariene micro-organismen.",
    dagen: 1362,
    duur: "ruim drie en een half jaar",
    afbraakPct: 94.2,
    referentiePct: 3.8,
  },
  {
    norm: "ASTM D5988",
    code: "D5988",
    omgeving: "Bodem",
    toelichting: "Begraven in vruchtbare aarde.",
    dagen: 1170,
    duur: "ruim drie jaar",
    afbraakPct: 91.1,
    referentiePct: null,
  },
  {
    norm: "ASTM D5511-18",
    code: "D5511",
    omgeving: "Stortplaats",
    toelichting: "Zonder zuurstof, zoals afval dat wordt afgedekt.",
    dagen: 1278,
    duur: "drie en een half jaar",
    afbraakPct: 91.1,
    referentiePct: 6.2,
  },
  {
    norm: "ASTM D5210-92",
    code: "D5210",
    omgeving: "Rioolslib",
    toelichting: "De omgeving waar waswater terechtkomt.",
    dagen: 952,
    duur: "ruim tweeënhalf jaar",
    afbraakPct: 90,
    referentiePct: null,
  },
] as const;

/**
 * De test die we als hoofdclaim voeren: zeewater, de hoogste uitkomst.
 * Gebruik deze in tegels en stats, met `KORTE_ONDERBOUWING` als bijschrift.
 */
export const HOOFDTEST = AFBRAAK_TESTS[0];

/**
 * De letterlijke disclaimer van CiCLO. Hoort bij elke weergave van de
 * testuitkomsten, in de pdf en op de claimpagina. Niet inkorten.
 */
export const CICLO_DISCLAIMER =
  "Laboratoriumtests weerspiegelen gecontroleerde omstandigheden. Afbraaksnelheden in ongecontroleerde natuurlijke omgevingen variëren.";

/**
 * De standaardregel onder een percentage in de copy. Dit is de minimale
 * onderbouwing die een claim uit de EmpCo-definitie haalt.
 */
export const KORTE_ONDERBOUWING = `${HOOFDTEST.afbraakPct}% afgebroken in ${HOOFDTEST.omgeving.toLowerCase()}, in ${HOOFDTEST.duur}.`;

/**
 * Percentage met een Nederlandse komma: 94.2 wordt "94,2".
 *
 * De percentages staan hierboven als `number`, want daar wordt mee gerekend en
 * op getest. In de copy hoort een komma. Zonder deze helper schreef elk van de
 * negentien pagina's zijn eigen `pct`-hulpje, en dat is precies het soort
 * duplicatie waarin er ooit één "94.2%" doorheen glipt.
 */
export function pctNl(waarde: number): string {
  return String(waarde).replace(".", ",");
}

/** Vaste linktekst naar de claimpagina. Overal dezelfde, ook voor herkenning. */
export const ONDERBOUWING_LINK_TEKST = "Zo is dat gemeten";

/** Het pad van de claimpagina. */
export const ONDERBOUWING_PAD = "/afbreekbaarheid";

/**
 * Certificaten die bij het doek horen.
 *
 * `nummer` is bewust configureerbaar en mag leeg zijn: het OEKO-TEX ECO
 * PASSPORT-nummer wordt opgevraagd bij Georg+Otto Friedrich en is nog niet
 * bekend. Een leeg nummer betekent "certificaat wel, nummer nog niet" — dat
 * tonen we eerlijk in plaats van het weg te laten of te verzinnen.
 */
export interface Certificaat {
  naam: string;
  omschrijving: string;
  /** Natrekbaar certificaatnummer, of null zolang het niet bekend is. */
  nummer: string | null;
}

/**
 * Het OEKO-TEX ECO PASSPORT-nummer, uit de omgeving zodat het zonder deploy
 * ingevuld kan worden zodra de wever het aanlevert.
 */
export const OEKO_TEX_NUMMER = process.env.OEKO_TEX_ECO_PASSPORT_NUMMER || null;

/**
 * Het Certificate of Authenticity van de lopende CiCLO-productiebatch.
 *
 * Bewust per batch en niet per order: CiCLO geeft het certificaat af op de
 * geproduceerde partij doek, niet op onze verkoop. Zolang het niet is ingevuld
 * meldt het dossier "op aanvraag" in plaats van een nummer te verzinnen.
 *
 * Invullen via de omgeving zodra het portaal (ciclo.texbase.com) toegang geeft.
 */
export const CICLO_BATCH_CERTIFICAAT =
  process.env.CICLO_BATCH_CERTIFICAAT || null;

export const CERTIFICATEN: readonly Certificaat[] = [
  {
    naam: "OEKO-TEX® ECO PASSPORT",
    omschrijving:
      "Onafhankelijke keuring van elke grondstof en elk chemisch bestanddeel op schadelijkheid voor mens en milieu.",
    nummer: OEKO_TEX_NUMMER,
  },
  {
    naam: "EU REACH",
    omschrijving:
      "Voldoet aan de Europese verordening voor veilig gebruik van chemische stoffen.",
    nummer: null,
  },
] as const;

/**
 * Het doek zelf. Eén plek, want dit hoort in het materiaalpaspoort én op de
 * claimpagina, en een inkoper trekt deze gegevens na bij de wever.
 */
export const DOEK = {
  merk: "Flag-CiCLO®",
  weverij: "Georg+Otto Friedrich GmbH, Duitsland",
  weefselnaam: "Jetflag Life",
  artikelnummers: ["6144CGS", "6144CK", "6953CK"],
  samenstelling: "Polyester met CiCLO®-additief",
} as const;
