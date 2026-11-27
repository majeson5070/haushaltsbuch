# Mein Haushaltsbuch (Web-App)

Ein einfaches Haushaltsbuch in einfacher Sprache: Ausgaben eintragen, automatisch
auswerten, Spartipps bekommen. Die App läuft komplett im Browser, alle Daten
bleiben auf dem Gerät (localStorage). Keine Konten, keine Werbung, keine Kosten.

Diese Dateien gehören zusammen:

| Datei | Aufgabe |
| --- | --- |
| index.html | Die ganze App (eine Datei) |
| sw.js | Offline-Speicher (nach erstem Öffnen geht die App ohne Internet) |
| manifest.json | Macht die App auf dem Startbildschirm zur App |
| VERSION.txt | Für die Update-Suche in der App |
| icon-192.png / icon-512.png | App-Icons (werden automatisch erzeugt) |
| tools/mache_icons.py | Zeichnet die App-Icons |
| tests/test.js | Prüf-Suite (Logik, Syntax, Bedienung) |
| .github/workflows/ci.yml | Prüft bei jedem Hochladen automatisch |

Funktionen: Zeiträume (Tag/Woche/Quartal/Jahr), 10 Warengruppen, Monats-Bilanz,
feste Kosten mit Übernahme, Spar-Tipps, Beleg-Import aus dem Chat,
automatisches Quittung-Lesen per Foto (Tesseract.js, Deutsch), Export/Import
der Daten, Druckansicht, Update-Suche.

Verbessern: index.html und VERSION.txt ersetzen, fertig. Die App zeigt nach
dem Neuladen die neue Version an (Fuß der Seite, „Nach Updates suchen“).

Wichtig: Das Regal enthält nur das leere Programm. Persönliche Daten werden
niemals hier gespeichert.

Aktuelle Version: **Nr. 5** · 27.11.2026 · Foto-Lesen, Foto-Karte oben, Versions-Nummer.
