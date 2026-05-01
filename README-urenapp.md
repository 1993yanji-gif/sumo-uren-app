# Urenregistratie app

Losse repo voor `sumo-uren-app`.

## Pagina's
- `/` → login medewerker
- `/register` → nieuwe medewerker aanmaken
- `/uren` → uren registreren + maandoverzicht exporteren
- `/admin` → admin dashboard met filters, medewerkersbeheer en export

## Installeren
```bash
npm install
npm run dev
```

## Huidige status
- Frontend draait in Next.js
- Data loopt via **Supabase**
- Medewerkers worden opgeslagen in Supabase tabel `employees`
- Uren worden opgeslagen in Supabase tabel `time_entries`
- Admin pagina vraagt eerst om een pincode
- Login, urenregistratie en admin lezen/schrijven direct via Supabase
- Export beschikbaar als CSV, Excel en PDF

## Belangrijke regel
Deze app gebruikt **altijd Supabase** voor database en data-opslag.

Niet gebruiken voor deze app:
- Cloudflare API
- D1
- Worker API als databron

## Admin pincode
- Standaard pincode: `2580`
- Later aanpasbaar via `NEXT_PUBLIC_ADMIN_PIN`

## Verwachte Supabase structuur
### Tabel `employees`
Velden:
- `id`
- `first_name`
- `last_name`
- `display_name`
- `pin`
- `is_active`

### Tabel `time_entries`
Velden:
- `id`
- `employee_id`
- `work_date`
- `start_time`
- `end_time`
- `break_minutes`
- `total_hours`
- `note`

## Nog handig om later te bouwen
- export per gekozen periode verfijnen
- maandrapporten mooier opmaken
- auditlog voor admin acties
- betere Supabase migraties/documentatie
