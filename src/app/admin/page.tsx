'use client'

import { useEffect, useMemo, useState } from 'react'
import { type EmployeeRecord } from '@/lib/hours-data'
import { createEmployee, getEmployees, getTimeEntries, updateEmployeePin, type TimeEntry } from '@/lib/supabase-hours'

const DEFAULT_ADMIN_PIN = '2580'
const ADMIN_PIN_STORAGE_KEY = 'sumo-uren-admin-auth'

export default function AdminPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [resetPinValues, setResetPinValues] = useState<Record<string, string>>({})
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingEmployee, setIsSavingEmployee] = useState(false)
  const [isUpdatingPinFor, setIsUpdatingPinFor] = useState<string | null>(null)

  const adminPin = process.env.NEXT_PUBLIC_ADMIN_PIN || DEFAULT_ADMIN_PIN
  const totalHours = useMemo(() => entries.reduce((sum, row) => sum + row.totalHours, 0), [entries])

  const uniqueEmployeesWithEntries = useMemo(() => {
    return new Set(entries.map((entry) => entry.employeeName)).size
  }, [entries])

  const latestEntries = useMemo(() => entries.slice(0, 8), [entries])

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return employees

    return employees.filter((employee) => {
      return employee.name.toLowerCase().includes(query) || employee.id.toLowerCase().includes(query)
    })
  }, [employees, searchQuery])

  const loadAdminData = async () => {
    try {
      const [employeesData, entriesData] = await Promise.all([getEmployees(), getTimeEntries()])
      setEmployees(employeesData)
      setEntries(entriesData)
    } catch (error) {
      console.error(error)
      setMessage('Kon admin gegevens niet laden.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedState = window.sessionStorage.getItem(ADMIN_PIN_STORAGE_KEY)
    if (savedState === 'ok') {
      setIsUnlocked(true)
    }
  }, [])

  useEffect(() => {
    if (!isUnlocked) return
    loadAdminData()
  }, [isUnlocked])

  const handleUnlock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (pinInput === adminPin) {
      setIsUnlocked(true)
      setPinError('')
      window.sessionStorage.setItem(ADMIN_PIN_STORAGE_KEY, 'ok')
      return
    }

    setPinError('Onjuiste pincode.')
  }

  const handleAddEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')

    const cleanFirstName = firstName.trim()
    const cleanLastName = lastName.trim()

    if (!cleanFirstName || !cleanLastName) {
      setMessage('Vul voornaam en achternaam in.')
      return
    }

    if (!/^\d{4}$/.test(pin)) {
      setMessage('Pincode moet uit 4 cijfers bestaan.')
      return
    }

    setIsSavingEmployee(true)

    try {
      const employee = await createEmployee(cleanFirstName, cleanLastName, pin)
      setFirstName('')
      setLastName('')
      setPin('')
      setMessage(`${employee.name} toegevoegd.`)
      await loadAdminData()
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : 'Er ging iets mis bij toevoegen.')
    } finally {
      setIsSavingEmployee(false)
    }
  }

  const handleRemoveEmployee = (employeeId: string) => {
    const employee = employees.find((item) => item.id === employeeId)
    setEmployees((current) => current.filter((item) => item.id !== employeeId))
    setMessage(employee ? `${employee.name} is lokaal uit dit overzicht verwijderd. Database-verwijderen bouwen we hierna.` : 'Medewerker verwijderd.')
  }

  const handlePinValueChange = (employeeId: string, value: string) => {
    setResetPinValues((current) => ({
      ...current,
      [employeeId]: value,
    }))
  }

  const handleUpdatePin = async (employeeId: string) => {
    const newPin = (resetPinValues[employeeId] || '').trim()
    const employee = employees.find((item) => item.id === employeeId)

    if (!/^\d{4}$/.test(newPin)) {
      setMessage('Nieuwe pincode moet uit 4 cijfers bestaan.')
      return
    }

    setIsUpdatingPinFor(employeeId)
    setMessage('')

    try {
      await updateEmployeePin(employeeId, newPin)
      setResetPinValues((current) => ({
        ...current,
        [employeeId]: '',
      }))
      setMessage(employee ? `Pincode van ${employee.name} is bijgewerkt.` : 'Pincode is bijgewerkt.')
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : 'Er ging iets mis bij het wijzigen van de pincode.')
    } finally {
      setIsUpdatingPinFor(null)
    }
  }

  if (!isUnlocked) {
    return (
      <main className="sumo-shell min-h-screen px-4 py-10 text-stone-900 md:px-6 md:py-14">
        <div className="mx-auto flex min-h-[80vh] max-w-lg items-center">
          <div className="sumo-card w-full rounded-[2rem] border-[rgba(97,74,42,0.16)] bg-[rgba(255,251,244,0.9)] p-8 shadow-[0_24px_70px_rgba(86,63,34,0.16)] md:p-10">
            <div className="rounded-[1.75rem] border border-[rgba(182,144,77,0.16)] bg-[rgba(255,252,247,0.88)] px-5 py-6 shadow-[0_12px_30px_rgba(86,63,34,0.06)] md:px-7">
              <p className="sumo-label mb-3 text-[0.7rem] text-[#8f714d]">Admin beveiliging</p>
              <h1 className="font-display text-4xl font-semibold leading-none text-[#2f2418]">Voer je pincode in</h1>
              <div className="mt-4 h-[2px] w-20 rounded-full bg-gradient-to-r from-[#9f7d49] via-[#ccb184] to-transparent" />
              <p className="mt-4 text-sm leading-relaxed text-[#4f4031]">
                De admin pagina is afgeschermd. Vul je pincode in om het urenoverzicht te openen.
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleUnlock}>
              <input
                type="password"
                inputMode="numeric"
                value={pinInput}
                onChange={(event) => setPinInput(event.target.value)}
                placeholder="Pincode"
                className="sumo-input w-full rounded-2xl px-4 py-4 text-lg tracking-[0.3em] outline-none transition"
              />
              <button
                type="submit"
                className="sumo-dark-button w-full rounded-2xl px-5 py-4 text-base font-semibold transition"
              >
                Open admin
              </button>
            </form>

            {pinError ? (
              <div className="sumo-danger mt-4 rounded-2xl px-4 py-3 text-sm">
                {pinError}
              </div>
            ) : null}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="sumo-shell min-h-screen px-4 py-10 text-stone-900 md:px-6 md:py-14">
      <div className="mx-auto max-w-7xl rounded-[2rem] sumo-card border-[rgba(97,74,42,0.16)] bg-[rgba(255,251,244,0.9)] p-6 shadow-[0_24px_70px_rgba(86,63,34,0.16)] md:p-10">
        <div className="rounded-[1.75rem] border border-[rgba(182,144,77,0.16)] bg-[rgba(255,252,247,0.88)] px-5 py-6 shadow-[0_12px_30px_rgba(86,63,34,0.06)] md:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="sumo-label mb-3 text-[0.7rem] text-[#8f714d]">Admin</p>
              <h1 className="font-display text-4xl font-semibold leading-none text-[#2f2418] md:text-5xl">Uren overzicht</h1>
              <div className="mt-4 h-[2px] w-20 rounded-full bg-gradient-to-r from-[#9f7d49] via-[#ccb184] to-transparent" />
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#4f4031] md:text-base">
                Eén plek voor uren, medewerkers en pinbeheer. Snel op mobiel, overzichtelijk voor jou.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sumo-soft-panel rounded-2xl px-4 py-4">
                <p className="sumo-soft-panel-title text-xs uppercase tracking-[0.18em]">Totaal uren</p>
                <p className="mt-1 text-2xl font-semibold text-stone-900">{totalHours.toFixed(2)}</p>
              </div>
              <div className="sumo-soft-panel rounded-2xl px-4 py-4">
                <p className="sumo-soft-panel-title text-xs uppercase tracking-[0.18em]">Medewerkers</p>
                <p className="mt-1 text-2xl font-semibold text-stone-900">{employees.length}</p>
              </div>
              <div className="sumo-soft-panel rounded-2xl px-4 py-4">
                <p className="sumo-soft-panel-title text-xs uppercase tracking-[0.18em]">Actief in uren</p>
                <p className="mt-1 text-2xl font-semibold text-stone-900">{uniqueEmployeesWithEntries}</p>
              </div>
            </div>
          </div>
        </div>

        {message ? (
          <div className="sumo-success mt-6 rounded-2xl px-4 py-3 text-sm">
            {message}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <section className="space-y-6">
            <div className="sumo-paper-card rounded-[1.75rem] p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl text-stone-900">Laatste uren</h2>
                  <p className="sumo-muted mt-2 text-sm">Snelle blik op de nieuwste registraties.</p>
                </div>
                <div className="rounded-2xl bg-[rgba(193,157,91,0.12)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8c6a2f]">
                  {entries.length} regels
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[rgba(97,74,42,0.08)]">
                <div className="hidden grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr] bg-[rgba(237,227,210,0.95)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#5e4830] md:grid">
                  <span>Naam</span>
                  <span>Datum</span>
                  <span>Begin</span>
                  <span>Einde</span>
                  <span>Pauze</span>
                  <span>Totaal</span>
                </div>

                <div className="divide-y divide-[rgba(97,74,42,0.08)]">
                  {isLoading ? (
                    <div className="px-4 py-6 text-sm text-stone-500">Gegevens laden...</div>
                  ) : latestEntries.length ? (
                    latestEntries.map((row) => (
                      <div key={row.id} className="px-4 py-4">
                        <div className="md:hidden">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-stone-900">{row.employeeName}</p>
                              <p className="mt-1 text-sm text-stone-500">{row.workDate}</p>
                            </div>
                            <p className="text-sm font-semibold text-[#8c6a2f]">{row.totalHours.toFixed(2)} uur</p>
                          </div>
                          <p className="mt-2 text-sm text-stone-500">
                            {row.startTime} - {row.endTime} · Pauze {row.breakMinutes} min
                          </p>
                        </div>

                        <div className="hidden grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr] items-center gap-3 text-sm md:grid">
                          <span className="font-medium text-stone-900">{row.employeeName}</span>
                          <span>{row.workDate}</span>
                          <span>{row.startTime}</span>
                          <span>{row.endTime}</span>
                          <span>{row.breakMinutes} min</span>
                          <span className="font-semibold text-[#8c6a2f]">{row.totalHours.toFixed(2)} uur</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-sm text-stone-500">Nog geen uren opgeslagen.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="sumo-paper-card rounded-[1.75rem] p-5 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="font-display text-3xl text-stone-900">Medewerkers beheren</h2>
                  <p className="sumo-muted mt-2 text-sm">Zoek snel iemand en wijzig direct de pin.</p>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Zoek op naam of ID"
                  className="sumo-input-light w-full rounded-2xl px-4 py-3 outline-none transition md:max-w-xs"
                />
              </div>

              <div className="mt-5 space-y-3">
                {filteredEmployees.length ? (
                  filteredEmployees.map((employee) => (
                    <div key={employee.id} className="sumo-panel rounded-2xl px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-stone-900">{employee.name}</p>
                          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">ID: {employee.id}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmployee(employee.id)}
                          className="rounded-xl border border-[rgba(161,68,68,0.24)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8c3737] transition hover:bg-[rgba(161,68,68,0.08)]"
                        >
                          Verwijderen
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          value={resetPinValues[employee.id] || ''}
                          onChange={(event) => handlePinValueChange(employee.id, event.target.value)}
                          placeholder="Nieuwe pincode (4 cijfers)"
                          className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdatePin(employee.id)}
                          disabled={isUpdatingPinFor === employee.id}
                          className="sumo-dark-button rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60"
                        >
                          {isUpdatingPinFor === employee.id ? 'Bezig...' : 'Wijzig pin'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="sumo-panel rounded-2xl px-4 py-4 text-sm text-stone-500">
                    Geen medewerkers gevonden voor deze zoekopdracht.
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="sumo-paper-card rounded-[1.75rem] p-5 md:p-6">
              <h2 className="font-display text-3xl text-stone-900">Nieuwe medewerker</h2>
              <p className="sumo-muted mt-2 text-sm">
                Voeg een medewerker toe met naam en eigen 4-cijferige pin.
              </p>

              <form className="mt-5 space-y-3" onSubmit={handleAddEmployee}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="Voornaam"
                    className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition"
                  />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Achternaam"
                    className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition"
                  />
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  placeholder="Pincode (4 cijfers)"
                  className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition"
                />
                <button
                  type="submit"
                  disabled={isSavingEmployee}
                  className="sumo-dark-button w-full rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60"
                >
                  {isSavingEmployee ? 'Bezig met toevoegen...' : 'Medewerker toevoegen'}
                </button>
              </form>
            </div>

            <div className="sumo-paper-card rounded-[1.75rem] p-5 md:p-6">
              <h2 className="font-display text-3xl text-stone-900">Snelle status</h2>
              <div className="mt-4 space-y-3 text-sm text-stone-600">
                <div className="sumo-panel rounded-2xl px-4 py-3">
                  <span className="font-medium text-stone-900">Laatste registratie:</span>{' '}
                  {latestEntries[0] ? `${latestEntries[0].employeeName} · ${latestEntries[0].workDate}` : 'Nog geen registraties'}
                </div>
                <div className="sumo-panel rounded-2xl px-4 py-3">
                  <span className="font-medium text-stone-900">Zoekresultaten:</span>{' '}
                  {filteredEmployees.length} medewerker(s)
                </div>
                <div className="sumo-panel rounded-2xl px-4 py-3">
                  <span className="font-medium text-stone-900">Admin status:</span> Ontgrendeld
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
