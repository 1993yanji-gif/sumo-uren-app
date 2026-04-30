# Urenregistratie app

Losse prototype repo voor `sumo-uren-app`.

## Pagina's
- `/uren` → medewerker voert naam, datum, begin/eind en pauze in
- `/admin` → demo admin-overzicht

## Installeren
```bash
npm install
npm run dev
```

## Huidige status
- Frontend prototype klaar
- Automatische urenberekening werkt client-side
- Admin kan medewerkers toevoegen/verwijderen in demo-state
- Opslaan is nu nog demo/local-only

## Volgende Cloudflare stappen
1. Nieuwe Cloudflare Pages/Workers project koppelen
2. D1 database aanmaken met tabel `time_entries`
3. API routes of Worker endpoints toevoegen voor opslaan/ophalen
4. Admin pagina beveiligen met Cloudflare Access of eenvoudige login

## Voorstel database
```sql
CREATE TABLE time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_name TEXT NOT NULL,
  work_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  total_hours REAL NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
