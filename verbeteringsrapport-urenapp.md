# Verbeteringsrapport — SUMO urenapp

## Algemene indruk

### Sterk nu
- De stijl is consistent en voelt als één app.
- Mobiel oogt de app netjes en rustig.
- Login, uren en admin zijn logisch gescheiden.
- De adminpagina is al duidelijk verbeterd qua bruikbaarheid.

### Hoofdprobleem nu
- De technische basis is nog op een paar punten kwetsbaar.
- Beveiliging rond pincodes is nog te zwak.
- Admin mist nog een paar echte beheerfuncties.
- De app werkt goed als MVP, maar is nog niet volledig “af”.

---

## Prioriteitenlijst

## Prioriteit 1 — Beveiliging

### Probleem
In `supabase-hours.ts` worden pincodes nu direct gelezen, opgeslagen en vergeleken als gewone waarde.

Dat betekent:
- Pin staat niet veilig genoeg opgeslagen.
- Login-check gebeurt client-side.
- Medewerkerdata is gevoeliger zichtbaar dan nodig.

### Advies
- Pincodes hashen en nooit plain opslaan.
- Login en pin reset via secure server-side route laten lopen.
- Client mag nooit alle pin-data kunnen ophalen.

### Impact
**Heel hoog**

---

## Prioriteit 2 — Echte verwijderfunctie medewerkers

### Probleem
De knop “Verwijderen” in admin verwijdert nu alleen lokaal uit het scherm en niet uit de database.

### Gevolg
- Verwarrend voor beheer.
- Gebruiker denkt dat medewerker weg is, maar dat is niet zo.

### Advies
- Echte delete of archive actie bouwen.
- Eerst bevestiging tonen.
- Liever archiveren / inactief zetten dan hard verwijderen.

### Impact
**Hoog**

---

## Prioriteit 3 — Betere validatie urenregistratie

### Probleem
De urenpagina gebruikt nog vrije tijdsinvoer met regex-check.

Kwetsbaar voor:
- invoerfouten
- rare formaten
- onlogische tijden

### Advies
- `type="time"` gebruiken waar mogelijk.
- Extra checks toevoegen:
  - eindtijd moet na begintijd liggen
  - pauze mag niet groter zijn dan dienst
  - waarschuwing bij extreem lange shifts
- Duidelijke foutmeldingen per veld tonen.

### Impact
**Hoog**

---

## UX verbeteringen

## Login pagina

### Nu goed
- Rustig
- Duidelijk
- Consistent

### Verbeteren
- Medewerker onthouden op apparaat.
- Pinveld met show/hide knop.
- Duidelijkere foutmelding bij verkeerde pin.
- Knop disabled totdat naam + pin ingevuld zijn.

### Impact
**Middel**

---

## Uren invoeren

### Nu goed
- Eenvoudig
- Totaalblok is fijn
- Maandoverzicht is handig

### Verbeteren
- Automatische tijd-input mask (`11:30`).
- Direct tonen: “Dienstduur 10 uur”.
- Knop pas actief als invoer geldig is.
- Bevestiging sterker maken na opslaan.
- “Vandaag” standaard visueel markeren.

### Extra slim
- Laatste ingevulde start/eindtijden onthouden per medewerker.
- Snelle pauzeknoppen:
  - 15 min
  - 30 min
  - 45 min
  - 60 min

### Impact
**Hoog**

---

## Admin dashboard

### Nu goed
- KPI’s
- Zoekfunctie
- Betere structuur
- Mobiel bruikbaar

### Nog verbeteren
- Filters op datum / medewerker
- Totaaluren per medewerker
- Sortering op recent / meeste uren
- Inklapbare medewerkerskaarten
- Sticky acties bovenin op mobiel
- Duidelijk onderscheid tussen:
  - urenoverzicht
  - medewerkersbeheer
  - instellingen

### Impact
**Hoog**

---

## Functionele uitbreidingen

## A. Medewerker detailkaart
Per medewerker:
- naam
- ID
- totaal uren deze maand
- laatste gewerkte datum
- pin wijzigen
- inactief zetten

### Impact
**Hoog**

---

## B. Uren filters in admin
Filters:
- vandaag
- deze week
- deze maand
- medewerker selecteren

### Impact
**Hoog**

---

## C. Bewerken van geregistreerde uren

### Probleem
Je ziet uren, maar kunt ze nog niet corrigeren.

### Toevoegen
- urenregel openen
- begin/eindtijd aanpassen
- pauze aanpassen
- verwijderen/corrigeren

### Impact
**Heel hoog**

---

## D. Export functie
Bijvoorbeeld:
- CSV export
- Excel export
- maandrapport per medewerker

### Impact
**Middel / hoog**

---

## Technische verbeteringen

## Structuur

### Probleem
Veel logica zit nog direct in page components.

### Advies
Opsplitsen naar:
- `components/admin/...`
- `components/uren/...`
- `hooks/...`
- `services/...`

Bijvoorbeeld:
- `EmployeeCard.tsx`
- `HoursTable.tsx`
- `AdminStats.tsx`
- `PinResetForm.tsx`

### Impact
**Middel**

---

## Data layer

### Probleem
`supabase-hours.ts` doet nu veel tegelijk.

### Advies
Splits in:
- employee service
- time entry service
- auth/pin service

### Impact
**Middel**

---

## State handling

### Probleem
De admin page heeft al veel lokale state.

### Advies
- Meer kleinere component state.
- Of eenvoudige reducer voor admin actions.

### Impact
**Middel**

---

## Data / database advies

## Aanbevolen velden employees
- `id`
- `first_name`
- `last_name`
- `display_name`
- `pin_hash`
- `is_active`
- `created_at`
- `updated_at`

## Aanbevolen velden time_entries
- `id`
- `employee_id`
- `work_date`
- `start_time`
- `end_time`
- `break_minutes`
- `total_hours`
- `created_at`
- `updated_at`
- `created_by`
- `note`

### Waarom
Dan kun je later:
- wijzigingen loggen
- medewerkers deactiveren
- audit trail bouwen

---

## Veiligheid / beheer
Aanrader:
- admin acties loggen
- pin reset bevestigen
- rate limit op login
- admin niet alleen met front-end pin beveiligen
- later echte admin auth toevoegen

### Impact
**Heel hoog**

---

## Concrete top 10 verbeteringen

1. Pincodes beveiligen met hashing + server-side auth
2. Echte delete/archive medewerker
3. Urenregels kunnen bewerken
4. Admin filters op datum en medewerker
5. Betere validatie van tijden/pauze
6. Medewerker detailkaart met maandtotaal
7. Export naar CSV/Excel
8. Show/hide pin + betere form UX
9. Componenten opsplitsen
10. Admin auth sterker maken

---

## Eindoordeel
De app is nu:
- visueel netjes
- duidelijk
- goed bruikbaar als MVP

Maar om hem echt stevig te maken moet vooral dit gebeuren:
- beveiliging
- beheerfuncties echt afmaken
- uren corrigeren/filteren/exporteren

## Kort advies
**Eerst veiligheid + echte adminacties. Daarna pas extra polish.**
