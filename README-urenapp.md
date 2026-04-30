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
- Homepage login + medewerker-aanmaak gekoppeld aan Cloudflare Functions
- Medewerkers worden opgeslagen in D1
- Uren worden opgeslagen in D1
- Admin pagina vraagt eerst om een pincode
- Admin leest medewerkers en uren uit de database

## Volgende Cloudflare stappen
1. Nieuwe Cloudflare Pages/Workers project koppelen
2. D1 database aanmaken met tabel `time_entries`
3. API routes of Worker endpoints toevoegen voor opslaan/ophalen
4. Admin pagina beveiligen met Cloudflare Access of eenvoudige login

## Admin pincode
- Standaard pincode: `2580`
- Later aanpasbaar via `NEXT_PUBLIC_ADMIN_PIN`

## Vereiste Cloudflare binding
- Pages frontend gebruikt straks `NEXT_PUBLIC_API_BASE_URL`
- Aparte Worker API gebruikt D1 binding naam: `DB`

## Worker API
- map: `worker-api/`
- worker naam: `sumo-uren-api`
- routes: `/api/employees`, `/api/login`, `/api/time-entries`

## Database
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
