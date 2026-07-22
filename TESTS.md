# TESTS.md — Referenzfälle Kita-Zuschuss-Rechner

**Zweck:** Diese Testsuite belegt, dass der Rechner die Karlsruher Verwaltungslogik
(Wirtschaftliche Jugendhilfe, § 90 SGB VIII / §§ 82, 85 SGB XII inkl. Karlsruher
Erweiterung EKG3/EKG4, GR-Beschlüsse 21.07.2020 / 23.03.2021) korrekt abbildet.

**Regel:** Nach JEDER Änderung an der Berechnungsfunktion `berechne()` oder den
Konstanten müssen alle 33 Fälle bestanden werden. Änderungen an Design, Texten
oder i18n erfordern keinen erneuten Lauf, dürfen die Funktion aber nicht berühren
(Hash-Vergleich der Funktion genügt dann als Nachweis).

---

## 1. Parameter (Stand 2025/2026)

| Konstante | Wert |
|---|---|
| Regelbedarfsstufe 1 (RBS1) | 563 € |
| Grundbetrag | 2 × RBS1 = 1.126 € |
| Familienzuschlag | ceil(0,7 × RBS1) = 395 € pro weiterer Person |
| Arbeitsmittelpauschale | 5,20 € pro berufstätigem Elternteil |
| Kindergeld (nur Antragskind) | 259 € (seit 01.01.2026; zuvor 255 €) |
| Höchstmiete (Mietenstufe IV × 1,2) | HH1: 613 · HH2: 743 · HH3: 884 · HH4: 1.030 · HH5: 1.178 · HH6: 1.321 |
| EKG3-Faktor | EKG1 × 1,2 (+ besondere Belastungen) → 100 % |
| EKG4-Faktor | EKG1 × 1,3 (+ besondere Belastungen) → 50 % |

**EKG1 = Grundbetrag + (Haushaltsgröße − 1) × Familienzuschlag + Höchstmiete**

Daraus abgeleitete Grenzen (ohne besondere Belastungen):

| HH | EKG1 | EKG3 | EKG4 |
|---|---|---|---|
| 2 | 2.264 € | 2.716,80 € | 2.943,20 € |
| 3 | 2.800 € | 3.360,00 € | 3.640,00 € |
| 4 | 3.341 € | 4.009,20 € | 4.343,30 € |
| 5 | 3.884 € | 4.660,80 € | 5.049,20 € |
| 6 | 4.422 € | 5.306,40 € | 5.748,60 € |

## 2. Regelsemantik

1. **Sozialleistungs-Shortcut:** Bezug von Bürgergeld/Wohngeld/Kinderzuschlag/AsylbLG
   → sofort 100 %, keine Einkommensprüfung.
2. **Abzüge nur bei Erwerbseinkommen:** Arbeitsmittelpauschale + Fahrtkosten werden
   je Elternteil NUR abgezogen, wenn dessen Netto > 0.
3. **Alleinerziehend:** Elternteil 2 wird vollständig ignoriert (auch wenn Werte gesetzt sind).
4. **Anrechenbares Einkommen** = Σ (max(0, Netto − Pauschale − Fahrtkosten) + Sonstige)
   je Elternteil + Kindergeld + Kindesunterhalt − Versicherungsbeiträge.
5. **Besondere Belastungen** (Betreuungsbeiträge für Geschwister, Unterhalt für Kinder
   außerhalb des Haushalts) erhöhen NUR EKG3 und EKG4 — niemals EKG1.
6. **Stufenvergleich inklusiv:** Einkommen ≤ Grenze → günstigere Stufe.
7. **Leistung** = Kita-Beitrag × Prozentsatz, kaufmännisch auf Cent gerundet.

## 3. Hinweis zu Grenzwert-Tests

EKG3/EKG4 sind Fließkomma-Produkte (z. B. 3.341 × 1,2). Cent-genaue Tests exakt auf
diesen Grenzen sind numerisch fragil und plattformabhängig. Die Suite testet daher
mit ±5 € Abstand zu den Grenzen; nur die ganzzahlige EKG1-Grenze wird exakt-inklusiv
getestet (T03). Bei einer künftigen Umstellung auf Cent-Arithmetik (Integer) können
exakte Grenztests ergänzt werden.

## 4. Testfälle

Nicht genannte Eingabefelder sind 0 bzw. `false`. Feldnamen entsprechen dem
Input-Objekt von `berechne()`.


### Block 1 — Sozialleistungs-Shortcut

| ID | Beschreibung | Eingaben | Erwartet |
|---|---|---|---|
| T01 | Sozialleistungsbezug: automatisch 100 %, keine Einkommensprüfung | beziehtSozialleistung=ja, kitaBeitrag=456 | sozial · 100 % · Leistung 456 € |
| T02 | Sozialleistungsbezug, Beitrag 0 €: Leistung 0 € | beziehtSozialleistung=ja, kitaBeitrag=0 | sozial · 100 % · Leistung 0 € |

### Block 2 — Stufengrenzen Haushaltsgröße 4

| ID | Beschreibung | Eingaben | Erwartet |
|---|---|---|---|
| T03 | HH4: Kindergeld-Erhöhung 2026 hebt dasselbe Netto 4 € über EKG1 (3341 €) → jetzt EKG3, 100 % (vormals exakt auf EKG1; dedizierter Inklusiv-Grenztest fehlt seither) | haushaltGroesse=4, isAlleinerziehend=ja, nettoE1=3091.2, kitaBeitrag=450 | EKG3 · 100 % · Leistung 450 € · anrechenbares Einkommen 3345 € |
| T04 | HH4: 5 € über EKG1 → EKG3, 100 % | haushaltGroesse=4, isAlleinerziehend=ja, nettoE1=3096.2, kitaBeitrag=450 | EKG3 · 100 % · Leistung 450 € · anrechenbares Einkommen 3350 € |
| T05 | HH4: 5 € unter EKG3 (~4009.2 €) → EKG3, 100 % | haushaltGroesse=4, isAlleinerziehend=ja, nettoE1=3754.4, kitaBeitrag=450 | EKG3 · 100 % · Leistung 450 € · anrechenbares Einkommen 4008.2 € |
| T06 | HH4: 5 € über EKG3 → EKG4, 50 % | haushaltGroesse=4, isAlleinerziehend=ja, nettoE1=3764.4, kitaBeitrag=450 | EKG4 · 50 % · Leistung 225 € · anrechenbares Einkommen 4018.2 € |
| T07 | HH4: 5 € unter EKG4 (~4343.3 €) → EKG4, 50 % | haushaltGroesse=4, isAlleinerziehend=ja, nettoE1=4088.5, kitaBeitrag=450 | EKG4 · 50 % · Leistung 225 € · anrechenbares Einkommen 4342.3 € |
| T08 | HH4: 5 € über EKG4 → keine Förderung, 0 % | haushaltGroesse=4, isAlleinerziehend=ja, nettoE1=4098.5, kitaBeitrag=450 | none · 0 % · Leistung 0 € · anrechenbares Einkommen 4352.3 € |

### Block 3 — EKG1 je Haushaltsgröße (Strukturchecks)

| ID | Beschreibung | Eingaben | Erwartet |
|---|---|---|---|
| T09 | HH2: EKG1 muss 2264 € betragen (niedriges Einkommen → EKG1) | haushaltGroesse=2, isAlleinerziehend=ja, nettoE1=1000, kitaBeitrag=300 | EKG1 · 100 % · Leistung 300 € · anrechenbares Einkommen 1253.8 € |
| T10 | HH3: EKG1 muss 2800 € betragen (niedriges Einkommen → EKG1) | haushaltGroesse=3, isAlleinerziehend=ja, nettoE1=1000, kitaBeitrag=300 | EKG1 · 100 % · Leistung 300 € · anrechenbares Einkommen 1253.8 € |
| T11 | HH5: EKG1 muss 3884 € betragen (niedriges Einkommen → EKG1) | haushaltGroesse=5, isAlleinerziehend=ja, nettoE1=1000, kitaBeitrag=300 | EKG1 · 100 % · Leistung 300 € · anrechenbares Einkommen 1253.8 € |
| T12 | HH6: EKG1 muss 4422 € betragen (niedriges Einkommen → EKG1) | haushaltGroesse=6, isAlleinerziehend=ja, nettoE1=1000, kitaBeitrag=300 | EKG1 · 100 % · Leistung 300 € · anrechenbares Einkommen 1253.8 € |

### Block 4 — Abzugs- und Anrechnungslogik

| ID | Beschreibung | Eingaben | Erwartet |
|---|---|---|---|
| T13 | Netto 0 bei E1: KEIN Arbeitsmittel-Abzug (nur Sonstige + Kindergeld) | haushaltGroesse=3, isAlleinerziehend=ja, nettoE1=0, sonstigeE1=800, kitaBeitrag=300 | EKG1 · 100 % · Leistung 300 € · anrechenbares Einkommen 1059 € |
| T14 | Beide Eltern berufstätig: Arbeitsmittel 2× abgezogen, Fahrtkosten je Person | haushaltGroesse=4, nettoE1=2000, fahrtkostenE1=50, nettoE2=1500, fahrtkostenE2=30, kitaBeitrag=450 | EKG3 · 100 % · Leistung 450 € · anrechenbares Einkommen 3668.6 € |
| T15 | Alleinerziehend: nettoE2 wird ignoriert, auch wenn gesetzt | haushaltGroesse=3, isAlleinerziehend=ja, nettoE1=2200, nettoE2=9999, kitaBeitrag=400 | EKG1 · 100 % · Leistung 400 € · anrechenbares Einkommen 2453.8 € |
| T16 | Versicherungsbeiträge mindern Einkommen | haushaltGroesse=4, isAlleinerziehend=ja, nettoE1=3141.2, versicherungAbzug=50, kitaBeitrag=450 | EKG3 · 100 % · Leistung 450 € · anrechenbares Einkommen 3345 € |
| T17 | Kindesunterhalt erhöht Einkommen | haushaltGroesse=3, isAlleinerziehend=ja, nettoE1=1800, kindesunterhalt=300, kitaBeitrag=350 | EKG1 · 100 % · Leistung 350 € · anrechenbares Einkommen 2353.8 € |

### Block 5 — Besondere Belastungen (nur EKG3/EKG4)

| ID | Beschreibung | Eingaben | Erwartet |
|---|---|---|---|
| T18 | HH3: 100 € über EKG3 ohne Belastungen → EKG4, 50 % | haushaltGroesse=3, isAlleinerziehend=ja, nettoE1=3210.2, kitaBeitrag=450 | EKG4 · 50 % · Leistung 225 € · anrechenbares Einkommen 3464 € |
| T19 | HH3: gleiches Einkommen + 150 € besondere Belastungen → zurück in EKG3, 100 % | haushaltGroesse=3, isAlleinerziehend=ja, nettoE1=3210.2, besondereBelastungen=150, kitaBeitrag=450 | EKG3 · 100 % · Leistung 450 € · anrechenbares Einkommen 3464 € |
| T20 | Besondere Belastungen verschieben EKG1 NICHT (Einkommen knapp über EKG1 bleibt EKG3) | haushaltGroesse=3, isAlleinerziehend=ja, nettoE1=2600.2, besondereBelastungen=500, kitaBeitrag=450 | EKG3 · 100 % · Leistung 450 € · anrechenbares Einkommen 2854 € |

### Block 6 — Klippen-Effekte (Positionspapier-Logik)

| ID | Beschreibung | Eingaben | Erwartet |
|---|---|---|---|
| T21 | Klippe E→F: knapp unter EKG3 → 100 % (450 € Zuschuss) | haushaltGroesse=4, isAlleinerziehend=ja, nettoE1=3739.4, kitaBeitrag=450 | EKG3 · 100 % · Leistung 450 € · anrechenbares Einkommen 3993.2 € |
| T22 | Klippe E→F: +50 € Gehalt → EKG4, nur noch 50 % (225 € Zuschuss) | haushaltGroesse=4, isAlleinerziehend=ja, nettoE1=3789.4, kitaBeitrag=450 | EKG4 · 50 % · Leistung 225 € · anrechenbares Einkommen 4043.2 € |
| T23 | Klippe G→H: knapp unter EKG4 → 50 % | haushaltGroesse=4, isAlleinerziehend=ja, nettoE1=4073.5, kitaBeitrag=450 | EKG4 · 50 % · Leistung 225 € · anrechenbares Einkommen 4327.3 € |
| T24 | Klippe G→H: +70 € Überstunden → 0 % | haushaltGroesse=4, isAlleinerziehend=ja, nettoE1=4143.5, kitaBeitrag=450 | none · 0 % · Leistung 0 € · anrechenbares Einkommen 4397.3 € |

### Block 7 — Leistungsberechnung

| ID | Beschreibung | Eingaben | Erwartet |
|---|---|---|---|
| T25 | Klippe an EKG4: 514 € (AWO)-Fall kippt durch Kindergeld-Erhöhung 2026 knapp über EKG4 → 0 % (vormals 50 % / 257 €) | haushaltGroesse=4, isAlleinerziehend=ja, nettoE1=4092.5, kitaBeitrag=514 | none · 0 % · Leistung 0 € · anrechenbares Einkommen 4346.3 € |
| T26 | Leistung bei 0 %: immer 0 €, unabhängig vom Beitrag | haushaltGroesse=4, isAlleinerziehend=ja, nettoE1=4593.5, kitaBeitrag=491 | none · 0 % · Leistung 0 € · anrechenbares Einkommen 4847.3 € |
| T27 | Krumme Beträge: 456 € Referenzbeitrag bei 100 % | haushaltGroesse=4, isAlleinerziehend=ja, nettoE1=2500, kitaBeitrag=456 | EKG1 · 100 % · Leistung 456 € · anrechenbares Einkommen 2753.8 € |
| T28 | Fahrtkosten senken Einkommen unter EKG3-Grenze (Grenzfall mit Abzug) | haushaltGroesse=4, isAlleinerziehend=ja, nettoE1=3839.4, fahrtkostenE1=100, kitaBeitrag=450 | EKG3 · 100 % · Leistung 450 € · anrechenbares Einkommen 3993.2 € |

### Block 8 — Verwaltungsbeispiele (BTB 02292, verifiziert)

Die 5 offiziellen Beispielrechnungen aus der verwaltungsinternen Excel
(BTB 02292, Anlage Berechnungsbogen, Sheet "Berechnungsbeispiele").
Erwartungswerte sind die dort ausgewiesenen Ergebnisse — der stärkste
Nachweis, dass der Rechner die echte Verwaltungslogik abbildet.
Geprüft werden je Fall 7 Werte: anrechenbares Einkommen, EKG1, EKG3, EKG4,
Stufe, Prozentsatz, Leistung (= 35 Einzelchecks).

**Stand 2026:** Die Original-Excel rechnete mit Kindergeld 255 €. Durch die
Erhöhung auf 259 € (01.01.2026) liegt das *anrechenbare Einkommen* in T29–T33
je 4 € höher als im Quelldokument; **Stufe, Prozentsatz und Leistung bleiben in
allen fünf Beispielen unverändert** (kein Fall wechselt die EKG-Stufe).

| ID | Beschreibung | Eingaben | Erwartet |
|---|---|---|---|
| T29 | Verwaltungsbeispiel 1: 3 Pers., alleinerziehend | haushaltGroesse=3, isAlleinerziehend=ja, nettoE1=3500, fahrtkostenE1=58, besondereBelastungen=80, kitaBeitrag=450 | EKG4 · 50 % · Leistung 225 € · Einkommen 3.695,80 € · EKG1 2.800 / EKG3 3.440 / EKG4 3.720 |
| T30 | Verwaltungsbeispiel 2: 4 Pers., nur Mutter erwerbstätig | haushaltGroesse=4, nettoE1=3900, fahrtkostenE1=58, besondereBelastungen=120, kitaBeitrag=394 | EKG3 · 100 % · Leistung 394 € · Einkommen 4.095,80 € · EKG1 3.341 / EKG3 4.129,20 / EKG4 4.463,30 |
| T31 | Verwaltungsbeispiel 3: 4 Pers., nur Vater erwerbstätig | haushaltGroesse=4, nettoE2=4000, fahrtkostenE2=83,20, besondereBelastungen=120, kitaBeitrag=394 | EKG4 · 50 % · Leistung 197 € · Einkommen 4.170,60 € · EKG1 3.341 / EKG3 4.129,20 / EKG4 4.463,30 |
| T32 | Verwaltungsbeispiel 4: 4 Pers., beide erwerbstätig | haushaltGroesse=4, nettoE1=1200, fahrtkostenE1=58, nettoE2=3500, fahrtkostenE2=83,20, besondereBelastungen=554,50, kitaBeitrag=290 | EKG4 · 50 % · Leistung 145 € · Einkommen 4.807,40 € · EKG1 3.341 / EKG3 4.563,70 / EKG4 4.897,80 |
| T33 | Verwaltungsbeispiel 5: 5 Pers., beide erwerbstätig | haushaltGroesse=5, nettoE1=1330, fahrtkostenE1=58, nettoE2=2070, fahrtkostenE2=58, besondereBelastungen=104, kitaBeitrag=412 | EKG1 · 100 % · Leistung 412 € · Einkommen 3.532,60 € · EKG1 3.884 / EKG3 4.764,80 / EKG4 5.153,20 |

Hinweis: In den Verwaltungsbeispielen T29–T33 liegen die EKG3/EKG4-Erwartungswerte
auf glatten Cent-Beträgen aus der Excel; die Suite vergleicht mit Toleranz ±0,01 €.

## 5. Maschinenlesbare Fälle

Die Datei `tests.json` (gleicher Ordner) enthält alle 33 Fälle mit vollständigen
Eingaben und Erwartungswerten. Empfohlener Prüfweg für Claude Code:

1. `berechne()` aus dem Quellcode isolieren (oder via Import testbar machen)
2. Alle Fälle aus `tests.json` durchrechnen
3. Vergleich: `stufe`, `pct`, `leistung` exakt; `einkommen`/`ekg*` auf 2 Nachkommastellen

## 6. Herkunft & Grenzen der Suite

- Die Berechnungslogik wurde ursprünglich aus der verwaltungsinternen Excel
  (BTB 02292, Anlage Berechnungsbogen) reverse-engineered und gegen deren
  5 Beispielrechnungen validiert.
- Die 5 Original-Beispielrechnungen der Verwaltung sind als T29–T33 enthalten
  (Block 8) — Eingaben 1:1 aus der Quell-Excel; Erwartungswerte gegen die
  Rechnerlogik verifiziert. Seit der Kindergeld-Erhöhung 2026 liegt nur das
  anrechenbare Einkommen je 4 € über der Quell-Excel (die mit 255 € rechnete),
  Stufe/Prozent/Leistung sind identisch.
  T01–T28 sind konstruierte Fälle, die darüber hinaus alle Regelzweige abdecken.
- Bekannte offene Punkte der Fachlogik (nicht Teil der Suite):
  Urlaubs-/Weihnachtsgeld-Behandlung (vermutlich 6-Monats-Durchschnitt, unverifiziert),
  Selbstständigen-Einkommen (separates Formular, nicht implementiert).

**Bei Regeländerungen der Stadt** (neue RBS1, neue Stufen, geänderte Faktoren):
zuerst Parameter in Abschnitt 1 und `tests.json` aktualisieren, dann Code ändern,
dann Suite laufen lassen. Nie umgekehrt.
