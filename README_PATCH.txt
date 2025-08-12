
Lernapp Patch: Erweiterter Fortschritt + Logo-Fix
=================================================

Einbau
------
1) Diese Datei ins Projekt (Root) hochladen:  patch_progress_logo.js
2) In deiner index.html direkt vor </body> einfügen:
   <script src="patch_progress_logo.js"></script>
3) Deploy → Seite neu laden.

Was ändert sich?
----------------
- Fortschritt zeigt zusätzlich:
  * Fragen gesamt (DB)
  * Antworten gesamt / richtig (Cloud)
  * Gelernt (mind. 1× richtig) & Offen
  * Letzte 5 Prüfungen mit Ergebnis & Dauer
- Logo-URL aus den Einstellungen wird zuverlässig angezeigt (auch als data: URI).

Voraussetzungen
---------------
- Tabellen: questions, reviews, exam_sessions
- Lesen auf diesen Tabellen per RLS erlaubt (mind. select). Eingeloggt zeigt Cloudwerte.
