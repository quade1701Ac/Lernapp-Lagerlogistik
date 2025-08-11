Lernapp Lagerlogistik – Deploy Build
====================================

Single-file App (index.html) mit Supabase-Anbindung
Vorgefüllt mit:
  URL: https://ebqfupcivmkbuadbbnwg.supabase.co
  anon: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicWZ1cGNpdm1rYnVhZGJibndnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDA5ODIsImV4cCI6MjA3MDQ3Njk4Mn0.P6IiwjFSpqVmObRbvxvY46l6vJlPsxPAc-wbr15Dhl0

Schnellstart lokal:
1) Doppelklick auf index.html (Lesen funktioniert; für Login/Schreiben besser kleiner Server)
2) Optional: PowerShell im Ordner -> `python -m http.server 5500` und dann http://localhost:5500 öffnen

Deploy (Netlify ohne Git):
1) https://app.netlify.com/drop öffnen
2) Den gesamten Ordner oder diese ZIP hochladen
3) Entstandene Netlify-URL in Supabase freigeben:
   - Authentication -> URL Configuration:
       Site URL: https://DEINE-NETLIFY-URL
       Redirect URLs: https://DEINE-NETLIFY-URL/*
   - Settings -> API -> CORS:
       https://DEINE-NETLIFY-URL (und optional http://localhost:5500)

Im Browser:
- Oben rechts "Einstellungen" -> Werte sind vorbefüllt; bei Bedarf ändern und speichern
- Admin -> Import JSON: *_import_ready.json Dateien laden
