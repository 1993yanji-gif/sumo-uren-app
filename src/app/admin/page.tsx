'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { type EmployeeRecord, type EmployeeSummary } from '@/lib/hours-data'
import {
  createEmployee,
  getEmployees,
  getTimeEntries,
  setEmployeeActiveStatus,
  summarizeEmployeeEntries,
  updateEmployeePin,
  type TimeEntry,
} from '@/lib/supabase-hours'

const DEFAULT_ADMIN_PIN = '2580'
const ADMIN_PIN_STORAGE_KEY = 'sumo-uren-admin-auth'

type DateFilter = 'today' | 'week' | 'month' | 'all'
type SortOption = 'recent' | 'hours'

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function isInDateFilter(value: string, filter: DateFilter) {
  if (filter === 'all') return true

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${value}T00:00:00`)

  if (filter === 'today') {
    return target.getTime() === today.getTime()
  }

  if (filter === 'week') {
    const weekStart = startOfWeek(today)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    return target >= weekStart && target < weekEnd
  }

  if (filter === 'month') {
    return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth()
  }

  return true
}

function formatDate(value: string | null) {
  if (!value) return 'Nog geen uren'
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

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
  const [isUpdatingStatusFor, setIsUpdatingStatusFor] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<DateFilter>('month')
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all')
  const [sortOption, setSortOption] = useState<SortOption>('recent')
  const [openEmployeeCards, setOpenEmployeeCards] = useState<Record<string, boolean>>({})
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active')

  const adminPin = process.env.NEXT_PUBLIC_ADMIN_PIN || DEFAULT_ADMIN_PIN

  const loadAdminData = async () => {
    try {
      const [employeesData, entriesData] = await Promise.all([
        getEmployees({ includeInactive: true }),
        getTimeEntries(),
      ])
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

  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => isInDateFilter(entry.workDate, dateFilter))
      .filter((entry) => selectedEmployeeFilter === 'all' || entry.employeeId === selectedEmployeeFilter)
      .sort((a, b) => {
        if (sortOption === 'hours') return b.totalHours - a.totalHours
        return `${b.workDate}-${b.id}`.localeCompare(`${a.workDate}-${a.id}`)
      })
  }, [entries, dateFilter, selectedEmployeeFilter, sortOption])

  const totalHours = useMemo(() => filteredEntries.reduce((sum, row) => sum + row.totalHours, 0), [filteredEntries])
  const uniqueEmployeesWithEntries = useMemo(() => new Set(filteredEntries.map((entry) => entry.employeeName)).size, [filteredEntries])
  const latestEntries = useMemo(() => filteredEntries.slice(0, 12), [filteredEntries])

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return employees
      .filter((employee) => {
        if (statusFilter === 'active') return employee.isActive !== false
        if (statusFilter === 'inactive') return employee.isActive === false
        return true
      })
      .filter((employee) => {
        if (!query) return true
        return employee.name.toLowerCase().includes(query) || employee.id.toLowerCase().includes(query)
      })
  }, [employees, searchQuery, statusFilter])

  const employeeSummaries = useMemo<EmployeeSummary[]>(() => {
    const scopedEntries = entries.filter((entry) => isInDateFilter(entry.workDate, 'month'))
    return summarizeEmployeeEntries(scopedEntries, filteredEmployees)
  }, [entries, filteredEmployees])

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

  const handleToggleEmployeeStatus = async (employee: EmployeeRecord) => {
    const nextStatus = !(employee.isActive !== false)
    const confirmed = window.confirm(
      nextStatus
        ? `Weet je zeker dat je ${employee.name} weer actief wilt maken?`
        : `Weet je zeker dat je ${employee.name} inactief wilt maken?`
    )

    if (!confirmed) return

    setIsUpdatingStatusFor(employee.id)
    setMessage('')

    try {
      await setEmployeeActiveStatus(employee.id, nextStatus)
      setMessage(nextStatus ? `${employee.name} is weer actief.` : `${employee.name} is inactief gezet.`)
      await loadAdminData()
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : 'Status wijzigen is mislukt.')
    } finally {
      setIsUpdatingStatusFor(null)
    }
  }

  const toggleEmployeeCard = (employeeId: string) => {
    setOpenEmployeeCards((current) => ({
      ...current,
      [employeeId]: !current[employeeId],
    }))
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
              <button type="submit" className="sumo-dark-button w-full rounded-2xl px-5 py-4 text-base font-semibold transition">
                Open admin
              </button>
            </form>

            {pinError ? <div className="sumo-danger mt-4 rounded-2xl px-4 py-3 text-sm">{pinError}</div> : null}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="sumo-shell min-h-screen px-4 py-10 text-stone-900 md:px-6 md:py-14">
      <div className="mx-auto max-w-7xl rounded-[2rem] sumo-card border-[rgba(97,74,42,0.16)] bg-[rgba(255,251,244,0.9)] p-6 shadow-[0_24px_70px_rgba(86,63,34,0.16)] md:p-10">
        <div className="rounded-[1.75rem] border border-[rgba(182,144,77,0.16)] bg-[rgba(255,252,247,0.88)] px-5 py-6 shadow-[0_12px_30px_rgba(86,63,34,0.06)] md:px-7">
          <div className="mb-4 flex justify-end">
            <Link href="/" className="sumo-ghost-button rounded-2xl px-4 py-2 text-sm font-semibold transition">
              Naar home
            </Link>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="sumo-label mb-3 text-[0.7rem] text-[#8f714d]">Admin</p>
              <h1 className="font-display text-4xl font-semibold leading-none text-[#2f2418] md:text-5xl">Beheer dashboard</h1>
              <div className="mt-4 h-[2px] w-20 rounded-full bg-gradient-to-r from-[#9f7d49] via-[#ccb184] to-transparent" />
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#4f4031] md:text-base">
                Eén plek voor urenoverzicht, medewerkersbeheer en instellingen.
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
                <p className="sumo-soft-panel-title text-xs uppercase tracking-[0.18em]">Actief in selectie</p>
                <p className="mt-1 text-2xl font-semibold text-stone-900">{uniqueEmployeesWithEntries}</p>
              </div>
            </div>
          </div>
        </div>

        {message ? <div className="sumo-success mt-6 rounded-2xl px-4 py-3 text-sm">{message}</div> : null}

        <div className="sticky top-3 z-10 mt-6 rounded-[1.5rem] border border-[rgba(97,74,42,0.08)] bg-[rgba(255,252,247,0.96)] p-4 shadow-[0_8px_24px_rgba(86,63,34,0.08)] backdrop-blur">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Zoek medewerker of ID"
              className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition"
            />
            <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as DateFilter)} className="sumo-input rounded-2xl px-4 py-3 outline-none transition">
              <option value="today">Vandaag</option>
              <option value="week">Deze week</option>
              <option value="month">Deze maand</option>
              <option value="all">Alles</option>
            </select>
            <select value={selectedEmployeeFilter} onChange={(event) => setSelectedEmployeeFilter(event.target.value)} className="sumo-input rounded-2xl px-4 py-3 outline-none transition">
              <option value="all">Alle medewerkers</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
            <select value={sortOption} onChange={(event) => setSortOption(event.target.value as SortOption)} className="sumo-input rounded-2xl px-4 py-3 outline-none transition">
              <option value="recent">Sortering: recent</option>
              <option value="hours">Sortering: meeste uren</option>
            </select>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <section className="space-y-6">
            <div className="sumo-paper-card rounded-[1.75rem] p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="sumo-label">Urenoverzicht</p>
                  <h2 className="font-display text-3xl text-stone-900">Laatste uren</h2>
                  <p className="sumo-muted mt-2 text-sm">Gefilterde registraties op datum en medewerker.</p>
                </div>
                <div className="rounded-2xl bg-[rgba(193,157,91,0.12)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8c6a2f]">
                  {filteredEntries.length} regels
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {isLoading ? (
                  <div className="sumo-panel rounded-2xl px-4 py-4 text-sm text-stone-500">Gegevens laden...</div>
                ) : latestEntries.length ? (
                  latestEntries.map((row) => (
                    <div key={row.id} className="sumo-panel rounded-2xl px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-stone-900">{row.employeeName}</p>
                          <p className="mt-1 text-sm text-stone-500">{row.workDate} · {row.startTime} - {row.endTime}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-[#8c6a2f]">{row.totalHours.toFixed(2)} uur</p>
                          <p className="text-xs text-stone-500">Pauze {row.breakMinutes} min</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="sumo-panel rounded-2xl px-4 py-4 text-sm text-stone-500">Geen uren gevonden voor deze filters.</div>
                )}
              </div>
            </div>

            <div className="sumo-paper-card rounded-[1.75rem] p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="sumo-label">Medewerkersbeheer</p>
                  <h2 className="font-display text-3xl text-stone-900">Medewerker detailkaarten</h2>
                </div>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'active' | 'inactive' | 'all')} className="sumo-input rounded-2xl px-4 py-3 outline-none transition">
                  <option value="active">Actief</option>
                  <option value="inactive">Inactief</option>
                  <option value="all">Alles</option>
                </select>
              </div>

              <div className="mt-5 space-y-4">
                {employeeSummaries.length ? (
                  employeeSummaries.map((summary) => {
                    const employee = filteredEmployees.find((item) => item.id === summary.employeeId)
                    if (!employee) return null
                    const isOpen = openEmployeeCards[employee.id] ?? false

                    return (
                      <div key={employee.id} className="sumo-panel rounded-[1.5rem] px-4 py-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <p className="text-lg font-semibold text-stone-900">{employee.name}</p>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${employee.isActive === false ? 'bg-stone-200 text-stone-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {employee.isActive === false ? 'Inactief' : 'Actief'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-stone-500">ID: {employee.id}</p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3 md:min-w-[340px]">
                            <div>
                              <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Uren deze maand</p>
                              <p className="mt-1 font-semibold text-stone-900">{summary.totalHours.toFixed(2)} uur</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Laatste gewerkte dag</p>
                              <p className="mt-1 font-semibold text-stone-900">{formatDate(summary.lastWorkedDate)}</p>
                            </div>
                            <div className="flex items-center justify-end">
                              <button type="button" onClick={() => toggleEmployeeCard(employee.id)} className="sumo-ghost-button rounded-2xl px-4 py-2 text-sm font-semibold transition">
                                {isOpen ? 'Inklappen' : 'Openen'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {isOpen ? (
                          <div className="mt-4 space-y-4 border-t border-[rgba(97,74,42,0.08)] pt-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Registraties deze maand</p>
                              <p className="mt-1 font-medium text-stone-900">{summary.entryCount}</p>
                            </div>

                            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                              <input
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                value={resetPinValues[employee.id] || ''}
                                onChange={(event) => handlePinValueChange(employee.id, event.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="Nieuwe pin (4 cijfers)"
                                className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdatePin(employee.id)}
                                disabled={isUpdatingPinFor === employee.id}
                                className="sumo-dark-button rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60"
                              >
                                {isUpdatingPinFor === employee.id ? 'Bezig...' : 'Pin wijzigen'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleEmployeeStatus(employee)}
                                disabled={isUpdatingStatusFor === employee.id}
                                className="sumo-light-button rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60"
                              >
                                {isUpdatingStatusFor === employee.id
                                  ? 'Bezig...'
                                  : employee.isActive === false
                                    ? 'Actief zetten'
                                    : 'Inactief zetten'}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )
                  })
                ) : (
                  <div className="sumo-panel rounded-2xl px-4 py-4 text-sm text-stone-500">Geen medewerkers gevonden voor deze filters.</div>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="sumo-paper-card rounded-[1.75rem] p-5 md:p-6">
              <p className="sumo-label">Instellingen</p>
              <h2 className="font-display text-3xl text-stone-900">Nieuwe medewerker</h2>
              <p className="sumo-muted mt-2 text-sm">Voeg een medewerker toe met naam en eigen 4-cijferige pin.</p>

              <form className="mt-5 space-y-3" onSubmit={handleAddEmployee}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input type="text" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Voornaam" className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition" />
                  <input type="text" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Achternaam" className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition" />
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Pincode (4 cijfers)"
                  className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition"
                />
                <button type="submit" disabled={isSavingEmployee} className="sumo-dark-button w-full rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60">
                  {isSavingEmployee ? 'Bezig met toevoegen...' : 'Medewerker toevoegen'}
                </button>
              </form>
            </div>

            <div className="sumo-paper-card rounded-[1.75rem] p-5 md:p-6">
              <p className="sumo-label">Snelle status</p>
              <h2 className="font-display text-3xl text-stone-900">Dashboard info</h2>
              <div className="mt-4 space-y-3 text-sm text-stone-600">
                <div className="sumo-panel rounded-2xl px-4 py-3">
                  <span className="font-medium text-stone-900">Laatste registratie:</span>{' '}
                  {latestEntries[0] ? `${latestEntries[0].employeeName} · ${latestEntries[0].workDate}` : 'Nog geen registraties'}
                </div>
                <div className="sumo-panel rounded-2xl px-4 py-3">
                  <span className="font-medium text-stone-900">Zoekresultaten:</span> {filteredEmployees.length} medewerker(s)
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
