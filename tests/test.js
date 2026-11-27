/* Prüf-Suite für das Haushaltsbuch · VERSION Nr. 7 · 27.11.2026 · FOTO-OBEN · UPDATE-SUCHE
   Aufruf: node test.js [quelldatei]  (Standard: das Canvas; im Web-Regal: index.html)
   A) Logik-Tests  B) Syntax-Check  C) DOM-Generalprobe  D) Update-Suche */
'use strict';
const fs = require('fs');
const MD_PFAD = process.argv[2] || '/home/user/canvases/haushaltsbuch/CANVAS.md';
let pass = 0, fail = 0;
function pruefen(name, ok) {
  if (ok) { pass++; console.log('PASS ' + name); }
  else { fail++; console.error('FAIL ' + name); }
}

const md = fs.readFileSync(MD_PFAD, 'utf8');
const anf = md.indexOf('<script>');
const ende = md.indexOf('</script>');
const code = md.slice(anf + 8, ende);
fs.writeFileSync('skript.js', code);
const logikStart = code.indexOf('// ================= LOGIK-BEGINN');
const logikEnde = code.indexOf('// ================= LOGIK-ENDE');
const logik = code.slice(logikStart, logikEnde);

/* ---------- A) Logik-Tests ---------- */
const HOOK = ';globalThis.__L__={VERSION,GRUPPEN,centAusEuro,euroAusCent,parseDatumFlex,zeitraumFuer,eintraegeIm,summeCent,eintragGruppenBeitraege,gruppenSummen,gruppeById,gruppeVorschlag,gruppeAusText,schnellZeilenParse,doppelteFinden,pruefListe,tippsBerechnen,fixKategorieById,fixMonatsCent,fixeSollMonat,fixSchonImMonat,monatsBilanz,belegParse,belegAusText,warenGruppeAusName,preisAmZeilenende,beispielEintraege,addTag,fmtDatum};';
new Function(logik + HOOK)();
const L = globalThis.__L__;
const HEUTE = '2026-11-27';

pruefen('centAusEuro: 12,50 → 1250', L.centAusEuro('12,50') === 1250);
pruefen('centAusEuro: 1.234,56 → 123456', L.centAusEuro('1.234,56') === 123456);
pruefen('centAusEuro: 2.75 (Punkt) → 275', L.centAusEuro('2.75') === 275);
pruefen('centAusEuro: 45,90 € → 4590', L.centAusEuro('45,90 €') === 4590);
pruefen('centAusEuro: Müll → null', L.centAusEuro('abc') === null);
pruefen('euroAusCent: 4590 → 45,90 €', L.euroAusCent(4590) === '45,90 €');
pruefen('parseDatumFlex: 26.11.2026', L.parseDatumFlex('26.11.2026', HEUTE) === '2026-11-26');
pruefen('parseDatumFlex: heute', L.parseDatumFlex('heute', HEUTE) === HEUTE);
pruefen('parseDatumFlex: gestern', L.parseDatumFlex('gestern', HEUTE) === '2026-11-26');
pruefen('parseDatumFlex: ISO durchreichen', L.parseDatumFlex('2026-11-26', HEUTE) === '2026-11-26');
pruefen('parseDatumFlex: Unsinn → null', L.parseDatumFlex('irgendwann', HEUTE) === null);

const zTag = L.zeitraumFuer('tag', HEUTE);
pruefen('zeitraumFuer Tag: Start 27.11., Ende exclusiv 28.11.', zTag.startIso === '2026-11-27' && zTag.endeIso === '2026-11-28');
const zWoche = L.zeitraumFuer('woche', HEUTE);
pruefen('Zeitraum Woche: Mo 23.11., Ende exclusiv 30.11.', zWoche.startIso === '2026-11-23' && zWoche.endeIso === '2026-11-30');
const zQuartal = L.zeitraumFuer('quartal', HEUTE);
pruefen('Zeitraum Quartal: ab 01.10.2026', zQuartal.startIso === '2026-10-01');

const liste = [
  { datum: '2026-11-27', laden: 'REWE', gruppe: 'lebensmittel', cent: 4590, positionen: [{ name: 'Tee', cent: 275, gruppe: 'lebensmittel' }, { name: 'Zahnpasta', cent: 345, gruppe: 'drogerie' }, { name: 'Brot', cent: 3970, gruppe: 'lebensmittel' }] },
  { datum: '2026-11-25', laden: 'Aldi', gruppe: 'lebensmittel', cent: 1200 },
  { datum: '2026-11-20', laden: 'Apotheke', gruppe: 'gesundheit', cent: 1890 }
];
pruefen('eintraegeIm: 3 im November-Testfenster', L.eintraegeIm(liste, '2026-11-01', '2026-12-01').length === 3);
pruefen('eintraegeIm: Ende ist exclusiv (26.–27.11. → 0 Treffer)', L.eintraegeIm(liste, '2026-11-26', '2026-11-27').length === 0);
pruefen('summeCent: 4590+1200+1890 = 7680', L.summeCent(liste) === 7680);
const beitraege = L.eintragGruppenBeitraege(liste[0]);
const drogerieAnteil = beitraege.filter(b => b.gruppe === 'drogerie').reduce((s, b) => s + b.cent, 0);
pruefen('eintragGruppenBeitraege: Beleg 345 Cent Drogerie', drogerieAnteil === 345);
const gSum = L.gruppenSummen(liste);
const drogerieSumme = gSum.filter(g => g.id === 'drogerie').reduce((s, g) => s + g.cent, 0);
pruefen('gruppenSummen: Drogerie 345 (Beleg-Aufteilung)', drogerieSumme === 345);
const lebensSumme = gSum.filter(g => g.id === 'lebensmittel').reduce((s, g) => s + g.cent, 0);
pruefen('gruppenSummen: Lebensmittel 275+3970+1200', lebensSumme === 275 + 3970 + 1200);

pruefen('gruppeVorschlag: rewe → lebensmittel', L.gruppeVorschlag('REWE Filiale') && L.gruppeVorschlag('REWE Filiale').id === 'lebensmittel');
pruefen('gruppeVorschlag: dm → drogerie', L.gruppeVorschlag('dm-drogerie') && L.gruppeVorschlag('dm-drogerie').id === 'drogerie');
pruefen('gruppeVorschlag: apotheke → gesundheit', L.gruppeVorschlag('Apotheke am Markt').id === 'gesundheit');
pruefen('gruppeVorschlag: unbekannt → null', L.gruppeVorschlag('Ladenhaus') === null);

const schnell = L.schnellZeilenParse('heute | REWE | 45,90\ngestern | Bäckerei | 4,20 | Lebensmittel\nMüllzeile ohne Betrag', HEUTE);
pruefen('schnellZeilenParse: 2 gut, 1 Fehler', schnell.ok.length === 2 && schnell.fehler.length === 1);
pruefen('schnellZeilenParse: „heute“ aufgelöst', schnell.ok[0].datum === HEUTE);
pruefen('schnellZeilenParse: Bäcker ohne Gruppe → Lebensmittel-Hinweis', schnell.ok[1].gruppe === 'lebensmittel');

pruefen('doppelteFinden: 2× Aldi 27.11.', L.doppelteFinden([
  { id: 'a', datum: '2026-11-27', laden: 'Aldi', gruppe: 'lebensmittel', cent: 1200 },
  { id: 'b', datum: '2026-11-27', laden: 'Aldi', gruppe: 'lebensmittel', cent: 1200 }
]).length === 1);
const pruef = L.pruefListe([
  { id: 'a', datum: '2027-01-01', laden: 'Reise', gruppe: 'sonstiges', cent: 5000 },
  { id: 'b', datum: '2026-11-27', laden: 'Aldi', gruppe: 'lebensmittel', cent: 1200, positionen: [{ name: 'Milch', cent: 900, gruppe: 'lebensmittel' }] },
  { id: 'c', datum: '2026-11-27', laden: 'Aldi', gruppe: 'lebensmittel', cent: 1200, positionen: [{ name: 'Milch', cent: 900, gruppe: 'lebensmittel' }] },
  { id: 'd', datum: '2026-11-26', laden: 'Kiosk', gruppe: 'sonstiges', cent: 99000 }
], HEUTE);
const pruefText = JSON.stringify(pruef);
pruefen('pruefListe: warnt vor Datum in der Zukunft', pruefText.indexOf('Zukunft') >= 0 || pruefText.indexOf('zukünftig') >= 0 || pruefText.indexOf('später') >= 0);
pruefen('pruefListe: warnt vor Großbetrag', pruefText.indexOf('990') >= 0 || pruefText.indexOf('Groß') >= 0 || pruefText.indexOf('groß') >= 0);
pruefen('pruefListe: warnt vor doppeltem Eintrag', pruefText.indexOf('oppel') >= 0);
pruefen('pruefListe: warnt, wenn Beleg-Positionen nicht zur Kasse passen', pruefText.indexOf('Rechnung') >= 0 || pruefText.indexOf('Positionen') >= 0);

const tipps = L.tippsBerechnen(liste, 200000, HEUTE, 30000);
const tippText = JSON.stringify(tipps);
pruefen('tippsBerechnen: kennt Top-Gruppe', tippText.indexOf('Lebensmittel') >= 0 || tippText.indexOf('Gruppe') >= 0);
pruefen('tippsBerechnen: Einnahmen über Ausgaben → Spar-Tipp', tippText.indexOf('spar') >= 0 || tippText.indexOf('Spar') >= 0 || tippText.indexOf('übrig') >= 0);
const tipps2 = L.tippsBerechnen(liste, 40000, HEUTE, 30000);
const tippText2 = JSON.stringify(tipps2);
pruefen('tippsBerechnen: feste Kosten > 50 % → Warnung', tippText2.indexOf('feste') >= 0 || tippText2.indexOf('Feste') >= 0);

pruefen('fixMonatsCent: monatlich 22000 bleibt 22000', L.fixMonatsCent({ cent: 22000, rythmus: 'monat' }) === 22000);
pruefen('fixMonatsCent: quartal 30000 → 10000', L.fixMonatsCent({ cent: 30000, rythmus: 'quartal' }) === 10000);
pruefen('fixMonatsCent: jährlich 12000 → 1000', L.fixMonatsCent({ cent: 12000, rythmus: 'jahr' }) === 1000);
const fixProbe = [{ cent: 22000, rythmus: 'monat' }, { cent: 12000, rythmus: 'jahr' }];
pruefen('fixeSollMonat: 22000 + 1000 = 23000', L.fixeSollMonat(fixProbe) === 23000);
pruefen('fixSchonImMonat: 📌-Eintrag blockiert November', L.fixSchonImMonat([{ datum: '2026-11-05', fix: 'f1' }], 'f1', HEUTE) === true);
pruefen('fixSchonImMonat: Oktober zählt nicht', L.fixSchonImMonat([{ datum: '2026-10-05', fix: 'f1' }], 'f1', HEUTE) === false);
const bilanz = L.monatsBilanz(liste, 200000, HEUTE, fixProbe);
pruefen('monatsBilanz: Einnahmen 200000', bilanz.einnahmen === 200000);
pruefen('monatsBilanz: feste Kosten 23000', bilanz.fixe === 23000);
pruefen('monatsBilanz: Einkäufe 7680', bilanz.ausgaben === 7680);
pruefen('monatsBilanz: Rest 200000-23000-7680 = 169320', bilanz.rest === 169320);

const blockOk = 'BELEG 26.11.2026 | REWE | 9,69\nTee | 2,75 | Lebensmittel\nZahnpasta | 3,45 | Drogerie\nBrot | 3,49';
const pOk = L.belegParse(blockOk, HEUTE);
pruefen('belegParse: Kopf und 3 Positionen', !!pOk.beleg && pOk.beleg.positionen.length === 3);
pruefen('belegParse: Summe 969, diff 0', pOk.beleg.cent === 969 && pOk.diff === 0 && pOk.summePos === 969);
pruefen('belegParse: Brot ohne Gruppe → sonstiges', pOk.beleg.positionen[2].gruppe === 'sonstiges');
const pDiff = L.belegParse('BELEG heute | Aldi | 10,00\nMilch | 1,29', HEUTE);
pruefen('belegParse: Differenz 871 erkannt', pDiff.diff === 871);
pruefen('belegParse: ohne BELEG-Zeile → Fehler', !L.belegParse('REWE 45,90', HEUTE).beleg);
pruefen('belegParse: unbekannte Warengruppe → Fehler in Liste', L.belegParse('BELEG heute | X | 5,00\nA | 2,00 | GibtEsNicht', HEUTE).fehler.length >= 1);

const rohRewe = 'REWE\nGottingstr. 6\n26.11.2026 14:32\nTEE PILKLEY 2,75\n1 MILCH 1,29 A\nZAHNPASTA 3,45\nSUMME 7,49\nBAR 7,49';
const o1 = L.belegAusText(rohRewe, HEUTE);
pruefen('OCR: BELEG-Zeile mit Datum, REWE, 7,49', o1.block.indexOf('BELEG 26.11.2026 | REWE | 7,49 €') === 0);
pruefen('OCR: 3 Positionen erkannt', o1.positionen.length === 3);
pruefen('OCR: Zahnpasta → drogerie (Artikel-Hinweis)', o1.positionen[2].gruppe === 'drogerie');
pruefen('OCR: Tee und Milch → lebensmittel', o1.positionen[0].gruppe === 'lebensmittel' && o1.positionen[1].gruppe === 'lebensmittel');
pruefen('OCR: Kassen-Summe erkannt (749)', o1.gesamtCent === 749);
const pO1 = L.belegParse(o1.block, HEUTE);
pruefen('OCR→belegParse: diff 0 (Rechnung geht auf)', pO1.beleg && pO1.diff === 0);
pruefen('OCR: keine Hinweise bei sauberem Bon', o1.hinweise.length === 0);

const rohZahl = 'ALDI SAGT DANKE\n27.11.2026\nBROT 3,49 B\nKAFFEE 4,29 B\nGESAMT 7,78\nEC-KARTE 7,78';
const o2 = L.belegAusText(rohZahl, HEUTE);
pruefen('OCR: EC-KARTE-Zeile bleibt draußen', o2.block.indexOf('EC-KARTE') < 0);
pruefen('OCR: 2 Positionen (Brot, Kaffee)', o2.positionen.length === 2 && o2.positionen[0].name === 'BROT');
pruefen('OCR: GESAMT-Zeile als Kassen-Summe (778)', o2.gesamtCent === 778);

const rohKeineSumme = 'dm-drogerie markt\n26.11.26\n2 x 1,50\nSHAMPOO 4,99\nBAR 7,99';
const o3 = L.belegAusText(rohKeineSumme, HEUTE);
pruefen('OCR: 2 x 1,50 → 300 Cent (Menge mal Preis)', o3.positionen[0].cent === 300);
pruefen('OCR: dm → Drogerie als Standard-Gruppe', o3.positionen[1].gruppe === 'drogerie');
pruefen('OCR: 2-stelliges Jahr 26.11.26 → 2026-11-26', o3.datumIso === '2026-11-26');
pruefen('OCR: Hinweis, wenn keine Kassen-Summe erkannt', o3.hinweise.join(' ').indexOf('Kassen-Summe') >= 0);
const pO3 = L.belegParse(o3.block, HEUTE);
pruefen('OCR→belegParse: (dm) diff 0', pO3.beleg && pO3.diff === 0);

const o4 = L.belegAusText('', HEUTE);
pruefen('OCR: leerer Text → leerer Block, 0 Positionen', o4.block === '' && o4.positionen.length === 0);
const o5 = L.belegAusText('Ganz langer Text ohne Preise', HEUTE);
pruefen('OCR: ohne Preise → leerer Block mit Erklär-Hinweis', o5.block === '' && o5.hinweise.length >= 1);
const o6 = L.belegAusText('KIOSK\nBROT 2,50', HEUTE);
pruefen('OCR: unbekannter Laden → Name oder Hinweis', o6.laden.length > 0 && (o6.laden === 'KIOSK' || o6.hinweise.join(' ').indexOf('Laden') >= 0));
pruefen('OCR: unbekannter Kiosk → Standardgruppe lebensmittel', o6.positionen[0].gruppe === 'lebensmittel');

const rohNetto = 'Netto Marken-Discount\nDortmund, den 26.11.26\n2 x 4,44\nFlamenco Kaminholz 11dm3\n8,88 B\nSUMME [2] 8,88\nSUMME € 8,88\nKartenzahlung EUR 8,88';
const o7 = L.belegAusText(rohNetto, HEUTE);
pruefen('Netto: 1 Position statt Doppel-Erkennung', o7.positionen.length === 1);
pruefen('Netto: echter Name Kaminholz erkannt', o7.positionen[0].name.indexOf('Kaminholz') >= 0);
pruefen('Netto: 8,88 → 888 Cent', o7.positionen[0].cent === 888);
pruefen('Netto: Kaminholz → Drogerie & Haushalt', o7.positionen[0].gruppe === 'drogerie');
pruefen('Netto: Gesamt 888 Cent aus Summe', o7.gesamtCent === 888);
const pO7 = L.belegParse(o7.block, HEUTE);
pruefen('Netto→belegParse: diff 0', pO7.beleg && pO7.diff === 0);
const rohNettoOhneB = 'Netto Marken-Discount\nFlamenco Kaminholz 11dm3\n8,88\nSUMME € 8,88';
const o8 = L.belegAusText(rohNettoOhneB, HEUTE);
pruefen('Netto ohne B-Suffix: Name aus Zeile darueber', o8.positionen.length === 1 && o8.positionen[0].name.indexOf('Kaminholz') >= 0 && o8.positionen[0].cent === 888);

pruefen('warenGruppeAusName: aspirin → gesundheit', L.warenGruppeAusName('ASPIRIN 500', 'lebensmittel') === 'gesundheit');
pruefen('warenGruppeAusName: unbekannt → Standard', L.warenGruppeAusName('QUARK', 'lebensmittel') === 'lebensmittel');
pruefen('preisAmZeilenende: „BROT 3,49 B“ → 349', L.preisAmZeilenende('BROT 3,49 B') === 349);
pruefen('preisAmZeilenende: „1.234,56 A“ → 123456', L.preisAmZeilenende('X 1.234,56 A') === 123456);
pruefen('preisAmZeilenende: kein Preis → null', L.preisAmZeilenende('BROT') === null);

pruefen('VERSION-Siegel im Skript: Nr. 7 · FOTO-OBEN · UPDATE-SUCHE', L.VERSION.indexOf('Nr. 7') >= 0 && L.VERSION.indexOf('FOTO-OBEN') >= 0 && L.VERSION.indexOf('UPDATE-SUCHE') >= 0);
pruefen('Fuß-Zeile im HTML synchron (Nr. 7 · FOTO-OBEN · UPDATE-SUCHE)', md.indexOf('VERSION Nr. 7 · 27.11.2026 · FOTO-OBEN · UPDATE-SUCHE</p>') >= 0);
pruefen('Update-Knopf im Fuß vorhanden', md.indexOf('onclick="updateSuchen()"') >= 0);
pruefen('Update-Hinweis-Feld vorhanden', md.indexOf('id="update-hinweis"') >= 0);
pruefen('OCR-Karte im HTML vorhanden', md.indexOf('id="ocr-eingabe"') >= 0 && md.indexOf('ocrFotoGewaehlt') >= 0);
pruefen('OCR-Status-Feld vorhanden', md.indexOf('id="ocr-status"') >= 0);

/* ---------- B) Syntax-Check ---------- */
try {
  require('child_process').execSync('node --check skript.js', { stdio: 'pipe' });
  pruefen('Syntax: node --check über das ganze Skript', true);
} catch (e) { pruefen('Syntax: node --check über das ganze Skript', false); }

/* ---------- C) DOM-Generalprobe ---------- */
function elFabrik() {
  const el = {
    _kinder: [], style: {}, dataset: {}, value: '', _text: '',
    get textContent() { return this._text; },
    set textContent(v) { this._text = String(v); },
    get innerHTML() { return this._html === undefined ? '' : this._html; },
    set innerHTML(v) { this._html = String(v); this._kinder = []; },
    className: '', files: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, appendChild() {}, removeChild() {}, remove() {},
    scrollIntoView() {}, click() { if (this._onclick) this._onclick(); }, focus() {},
    getContext() { return null; }, toDataURL() { return 'data:image/jpeg;base64,QUJD'; },
    firstChild: null, parentNode: null, head: null
  };
  return el;
}
const kopie = code + ';globalThis.__HHB__={ST,ocrVerarbeiten,ocrStatus,belegEinfuegen,schnellHinzufuegen,beispielLaden,posZeigen,zeigeTab,exportJson,importJson,fixUebernehmen,eintragLoeschen,updateSuchen,VERSION:typeof VERSION!=="undefined"?VERSION:null};';
const bestaetigungen = []; const alerts = [];
globalThis.document = {
  _ids: {},
  getElementById(id) { if (!this._ids[id]) { this._ids[id] = elFabrik(); } return this._ids[id]; },
  createElement() { return elFabrik(); },
  body: elFabrik(), head: elFabrik(), addEventListener() {}
};
globalThis.localStorage = { _d: {}, getItem(k) { return this._d[k] === undefined ? null : this._d[k]; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
globalThis.confirm = (t) => { bestaetigungen.push(t); return true; };
globalThis.alert = (t) => { alerts.push(t); };
Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true });
globalThis.setTimeout = (fn, ms) => 0;
globalThis.scrollTo = () => {};
try {
  new Function(kopie)();
  pruefen('DOM-Stub: App startet ohne Fehler (init läuft)', true);
} catch (e) { pruefen('DOM-Stub: App startet ohne Fehler (init läuft)', false); console.error(e.message); }
const H = globalThis.__HHB__;

if (H) {
  const feld = (id) => globalThis.document._ids[id] || globalThis.document.getElementById(id);

  feld('schnell-feld').value = 'heute | REWE | 45,90\nheute | Bäckerei | 4,20 | Lebensmittel';
  const vorher = H.ST.eintraege.length;
  H.schnellHinzufuegen();
  pruefen('DOM: Schnell-Zeilen legen 2 Einträge an', H.ST.eintraege.length === vorher + 2);
  pruefen('DOM: REWE automatisch als Lebensmittel erkannt', H.ST.eintraege[vorher].gruppe === 'lebensmittel');

  feld('beleg-feld').value = 'BELEG 26.11.2026 | REWE Filiale | 9,69\nTee | 2,75 | Lebensmittel\nZahnpasta | 3,45 | Drogerie\nBrot | 3,49';
  H.belegEinfuegen();
  const belegEintrag = H.ST.eintraege.filter(e => e.laden === 'REWE Filiale' && e.cent === 969)[0];
  pruefen('DOM: Beleg-Block wird übernommen', !!belegEintrag);
  pruefen('DOM: Beleg hat 3 Positionen', belegEintrag && belegEintrag.positionen.length === 3);

  feld('beleg-feld').value = 'BELEG 25.11.2026 | Aldi | 10,00\nMilch | 1,29';
  H.belegEinfuegen();
  pruefen('DOM: Bei Differenz wird nachgefragt (confirm)', bestaetigungen.length >= 1);
  const aldi = H.ST.eintraege.filter(e => e.laden === 'Aldi' && e.cent === 1000)[0];
  pruefen('DOM: Differenz-Position eingefügt', aldi && aldi.positionen.some(p => p.name.indexOf('Differenz') >= 0));

  const dupVorher = bestaetigungen.length;
  feld('beleg-feld').value = 'BELEG 26.11.2026 | REWE Filiale | 9,69\nTee | 2,75 | Lebensmittel\nZahnpasta | 3,45 | Drogerie\nBrot | 3,49';
  H.belegEinfuegen();
  pruefen('DOM: Doppelten Beleg ansprechen (Rückfrage)', bestaetigungen.length > dupVorher);

  if (belegEintrag) { H.posZeigen(belegEintrag.id); }
  pruefen('DOM: Positionen-Fenster zeigt Artikel', feld('pos-kasten').innerHTML.indexOf('Zahnpasta') >= 0);

  feld('ocr-status').textContent = '';
  H.ocrVerarbeiten(rohRewe);
  pruefen('DOM: OCR füllt Beleg-Feld mit BELEG-Zeile', feld('beleg-feld').value.indexOf('BELEG 26.11.2026 | REWE | 7,49') === 0);
  pruefen('DOM: OCR meldet „3 Positionen“', feld('beleg-ergebnis').textContent.indexOf('3 Positionen') >= 0);
  pruefen('DOM: OCR-Status sagt „Fertig gelesen“', feld('ocr-status').textContent.indexOf('Fertig gelesen') === 0);
  const ocrVorher = H.ST.eintraege.length;
  H.belegEinfuegen();
  pruefen('DOM: OCR-Beleg wird übernommen (+1 Eintrag)', H.ST.eintraege.length === ocrVorher + 1);
  const ocrEintrag = H.ST.eintraege[H.ST.eintraege.length - 1];
  pruefen('DOM: OCR-Beleg hat 3 Positionen und 749 Cent', ocrEintrag.positionen.length === 3 && ocrEintrag.cent === 749);

  H.ocrVerarbeiten('');
  pruefen('DOM: OCR ohne Text → Erklär-Text, Feld leer', feld('beleg-feld').value === '' && feld('beleg-ergebnis').textContent.length > 5);

  H.ST.fixe.push({ id: 'fTest', name: 'Testkredit', kategorie: 'kredit', eigName: '', eigGruppe: 'wohnen', cent: 22000, rythmus: 'monat' });
  H.fixUebernehmen('fTest');
  pruefen('DOM: 📌 Fixkosten-Übernahme legt Eintrag an', H.ST.eintraege.some(e => e.fix === 'fTest' || String(e.name || '').indexOf('Testkredit') >= 0 || String(e.laden || '').indexOf('Testkredit') >= 0));

  H.exportJson();
  const sicherung = feld('export-feld').value;
  const sicherungsObjekt = JSON.parse(sicherung);
  pruefen('DOM: Export enthält Einträge und Fixe', Array.isArray(sicherungsObjekt.eintraege) && sicherungsObjekt.eintraege.length > 0 && Array.isArray(sicherungsObjekt.fixe));
  pruefen('DOM: Export enthält Beleg-Positionen', sicherungsObjekt.eintraege.some(e => e.positionen && e.positionen.length >= 3));
  feld('import-feld').value = sicherung;
  H.importJson();
  pruefen('DOM: Import stellt Einträge wieder her', H.ST.eintraege.length === sicherungsObjekt.eintraege.length);

  const bVorher = H.ST.eintraege.length;
  H.beispielLaden();
  pruefen('DOM: Beispiel-Daten legen mindestens 23 Einträge dazu', H.ST.eintraege.length >= bVorher + 23);
}

/* ---------- D) Update-Suche ---------- */
async function extraTests() {
  if (!H) { return; }
  const feldU = (id) => globalThis.document._ids[id] || globalThis.document.getElementById(id);
  const warte = () => new Promise(function (r) { setImmediate(r); });

  globalThis.fetch = function () { return Promise.resolve({ ok: false }); };
  H.updateSuchen();
  await warte(); await warte();
  pruefen('Update-Suche: ohne Update-Info → Hinweis auf Web-App', feldU('update-hinweis').textContent.indexOf('Web-App') >= 0);

  globalThis.fetch = function () { return Promise.resolve({ ok: true, text: function () { return Promise.resolve(String(H.VERSION)); } }); };
  H.updateSuchen();
  await warte(); await warte();
  pruefen('Update-Suche: gleiche Version → „neuesten Stand“', feldU('update-hinweis').textContent.indexOf('neuesten Stand') >= 0);

  globalThis.fetch = function () { return Promise.resolve({ ok: true, text: function () { return Promise.resolve('VERSION 99.99.9999 · NEU'); } }); };
  H.updateSuchen();
  await warte(); await warte();
  pruefen('Update-Suche: neuere Version wird gemeldet', feldU('update-hinweis').textContent.indexOf('neuere Version') >= 0);

  globalThis.fetch = function () { return Promise.reject(new Error('offline')); };
  H.updateSuchen();
  await warte(); await warte();
  pruefen('Update-Suche: Fehler abgefangen (kein Absturz, Hinweis da)', feldU('update-hinweis').textContent.length > 5);
}

extraTests().then(function () {
  console.log('Ergebnis: ' + pass + ' PASS / ' + fail + ' FAIL');
  process.exit(fail ? 1 : 0);
}).catch(function (e) {
  console.error('Extra-Tests abgestürzt:', e && e.message);
  console.log('Ergebnis: ' + pass + ' PASS / ' + fail + ' FAIL');
  process.exit(1);
});
