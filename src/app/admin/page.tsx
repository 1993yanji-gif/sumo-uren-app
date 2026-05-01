'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { type EmployeeRecord, type EmployeeSummary } from '@/lib/hours-data'
import {
  deleteTimeEntry,
  getEmployees,
  getTimeEntries,
  setEmployeeActiveStatus,
  summarizeEmployeeEntries,
  updateEmployeePin,
  updateTimeEntry,
  type TimeEntry,
} from '@/lib/supabase-hours'
import { exportToCsv, exportToExcel, exportToPdf, mapEntriesForExport } from '@/lib/export-utils'

const DEFAULT_ADMIN_PIN = '2580'
const ADMIN_PIN_STORAGE_KEY = 'sumo-uren-admin-auth'

type DateFilter = 'today' | 'week' | 'month' | 'all'
type SortOption = 'recent' | 'hours'

const currentMonthKey = new Date().toISOString().slice(0, 7)

function shiftMonth(monthKey: string, diff: number) {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1 + diff, 1)
  const shiftedYear = date.getFullYear()
  const shiftedMonth = String(date.getMonth() + 1).padStart(2, '0')
  return `${shiftedYear}-${shiftedMonth}`
}

function isInSpecificMonth(value: string, monthKey: string) {
  return value.slice(0, 7) === monthKey
}

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
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [resetPinValues, setResetPinValues] = useState<Record<string, string>>({})
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingPinFor, setIsUpdatingPinFor] = useState<string | null>(null)
  const [isUpdatingStatusFor, setIsUpdatingStatusFor] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<DateFilter>('month')
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey)
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all')
  const [sortOption, setSortOption] = useState<SortOption>('recent')
  const [openEmployeeCards, setOpenEmployeeCards] = useState<Record<string, boolean>>({})
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active')
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null)
  const [editingEntryForm, setEditingEntryForm] = useState({ date: '', startTime: '', endTime: '', breakMinutes: '30' })
  const [isUpdatingEntry, setIsUpdatingEntry] = useState(false)

  const adminPin = process.env.NEXT_PUBLIC_ADMIN_PIN || DEFAULT_ADMIN_PIN

  const loadAdminData = async () => {
    try {
      const [employeesData, entriesData] = await Promise.all([
        getEmployees({ includeInactive: true }),
        getTimeEntries(),
      ])
      setEmployees(employeesData)
      setEntries(entriesData)
      setMessage('')
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : 'Kon admin gegevens niet laden.')
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
      .filter((entry) => {
        if (dateFilter === 'month') return isInSpecificMonth(entry.workDate, selectedMonth)
        return isInDateFilter(entry.workDate, dateFilter)
      })
      .filter((entry) => selectedEmployeeFilter === 'all' || entry.employeeId === selectedEmployeeFilter)
      .sort((a, b) => {
        if (sortOption === 'hours') return b.totalHours - a.totalHours
        return `${b.workDate}-${b.id}`.localeCompare(`${a.workDate}-${a.id}`)
      })
  }, [entries, dateFilter, selectedEmployeeFilter, sortOption, selectedMonth])

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
    const scopedEntries = entries.filter((entry) => isInSpecificMonth(entry.workDate, selectedMonth))
    return summarizeEmployeeEntries(scopedEntries, filteredEmployees)
  }, [entries, filteredEmployees, selectedMonth])

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

  const startEditingEntry = (entry: TimeEntry) => {
    setEditingEntryId(entry.id)
    setEditingEntryForm({
      date: entry.workDate,
      startTime: entry.startTime,
      endTime: entry.endTime,
      breakMinutes: String(entry.breakMinutes),
    })
  }

  const cancelEditingEntry = () => {
    setEditingEntryId(null)
  }

  const saveEditedEntry = async () => {
    if (!editingEntryId) return

    const breakMinutes = Number(editingEntryForm.breakMinutes)

    if (!editingEntryForm.date) {
      setMessage('Kies een datum.')
      return
    }

    if (!/^\d{2}:\d{2}$/.test(editingEntryForm.startTime) || !/^\d{2}:\d{2}$/.test(editingEntryForm.endTime)) {
      setMessage('Begin- en eindtijd moeten in HH:MM staan.')
      return
    }

    if (Number.isNaN(breakMinutes) || breakMinutes < 0) {
      setMessage('Pauze moet 0 of hoger zijn.')
      return
    }

    const confirmed = window.confirm('Weet je zeker dat je deze urenregel wilt bijwerken?')
    if (!confirmed) return

    setIsUpdatingEntry(true)
    setMessage('')
    try {
      await updateTimeEntry({
        id: editingEntryId,
        date: editingEntryForm.date,
        startTime: editingEntryForm.startTime,
        endTime: editingEntryForm.endTime,
        breakMinutes,
      })
      await loadAdminData()
      setMessage('Urenregel bijgewerkt.')
      setEditingEntryId(null)
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : 'Bijwerken mislukt.')
    } finally {
      setIsUpdatingEntry(false)
    }
  }

  const removeEntry = async (entryId: number) => {
    const confirmed = window.confirm('Weet je zeker dat je deze urenregel wilt verwijderen?')
    if (!confirmed) return

    try {
      await deleteTimeEntry(entryId)
      setMessage('Urenregel verwijderd.')
      await loadAdminData()
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : 'Verwijderen mislukt.')
    }
  }

  const handleAdminExport = (type: 'csv' | 'excel' | 'pdf') => {
    if (!filteredEntries.length) {
      setMessage('Er zijn geen uren om te exporteren.')
      return
    }

    const rows = mapEntriesForExport(filteredEntries)
    const filterLabel = selectedEmployeeFilter === 'all'
      ? dateFilter
      : `${dateFilter}-${selectedEmployeeFilter}`
    const baseFilename = `urenoverzicht-${filterLabel}`

    if (type === 'csv') {
      exportToCsv(rows, `${baseFilename}.csv`)
      return
    }

    if (type === 'excel') {
      exportToExcel(rows, `${baseFilename}.xlsx`)
      return
    }

    exportToPdf(rows, `${baseFilename}.pdf`, `Urenoverzicht ${filterLabel}`)
  }

  const handleEmployeeMonthReport = (summary: EmployeeSummary) => {
    const employeeEntries = entries.filter((entry) => entry.employeeId === summary.employeeId && isInDateFilter(entry.workDate, 'month'))

    if (!employeeEntries.length) {
      setMessage('Deze medewerker heeft geen uren deze maand.')
      return
    }

    const rows = mapEntriesForExport(employeeEntries)
    const safeName = summary.employeeName.toLowerCase().replace(/\s+/g, '-')
    exportToPdf(rows, `maandrapport-${safeName}.pdf`, `Maandrapport ${summary.employeeName}`)
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
          <div className="mb-4 flex justify-end gap-3">
            <Link href="/admin/settings" className="sumo-light-button rounded-2xl px-4 py-2 text-sm font-semibold transition">
              Instellingen
            </Link>
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

          {dateFilter === 'month' ? (
            <div className="mt-3 flex items-center gap-2 md:max-w-md">
              <button type="button" onClick={() => setSelectedMonth((current) => shiftMonth(current, -1))} className="sumo-ghost-button rounded-2xl px-3 py-2 text-sm font-semibold transition">
                ←
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="sumo-input flex-1 rounded-2xl px-4 py-3 outline-none transition"
              />
              <button type="button" onClick={() => setSelectedMonth((current) => shiftMonth(current, 1))} className="sumo-ghost-button rounded-2xl px-3 py-2 text-sm font-semibold transition">
                →
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          <section className="space-y-6">
            <div className="sumo-paper-card rounded-[1.75rem] p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="sumo-label">Urenoverzicht</p>
                  <h2 className="font-display text-3xl text-stone-900">Laatste uren</h2>
                  <p className="sumo-muted mt-2 text-sm">Gefilterde registraties op datum en medewerker.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <div className="rounded-2xl bg-[rgba(193,157,91,0.12)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8c6a2f]">
                    {filteredEntries.length} regels
                  </div>
                  <button type="button" onClick={() => handleAdminExport('csv')} className="sumo-ghost-button rounded-2xl px-4 py-2 text-sm font-semibold transition">CSV</button>
                  <button type="button" onClick={() => handleAdminExport('excel')} className="sumo-ghost-button rounded-2xl px-4 py-2 text-sm font-semibold transition">Excel</button>
                  <button type="button" onClick={() => handleAdminExport('pdf')} className="sumo-ghost-button rounded-2xl px-4 py-2 text-sm font-semibold transition">PDF</button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {isLoading ? (
                  <div className="sumo-panel rounded-2xl px-4 py-4 text-sm text-stone-500">Gegevens laden...</div>
                ) : latestEntries.length ? (
                  latestEntries.map((row) => (
                    <div key={row.id} className="sumo-panel rounded-2xl px-4 py-4">
                      {editingEntryId === row.id ? (
                        <div className="rounded-[1.5rem] border border-[rgba(97,74,42,0.08)] bg-[rgba(255,252,247,0.9)] p-4 md:p-5">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="font-medium text-stone-900">Bewerk urenregel van {row.employeeName}</p>
                              <p className="mt-1 text-sm text-stone-500">Pas datum, tijden en pauze aan en sla daarna op.</p>
                            </div>
                            <div className="rounded-2xl bg-[rgba(193,157,91,0.12)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8c6a2f]">
                              Regel #{row.id}
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <label className="grid gap-2 text-sm text-stone-600">
                              <span className="font-medium text-stone-900">Datum</span>
                              <input type="date" value={editingEntryForm.date} onChange={(event) => setEditingEntryForm((current) => ({ ...current, date: event.target.value }))} className="sumo-input rounded-2xl px-4 py-3 outline-none transition" />
                            </label>
                            <label className="grid gap-2 text-sm text-stone-600">
                              <span className="font-medium text-stone-900">Begintijd</span>
                              <input type="time" value={editingEntryForm.startTime} onChange={(event) => setEditingEntryForm((current) => ({ ...current, startTime: event.target.value }))} className="sumo-input rounded-2xl px-4 py-3 outline-none transition" />
                            </label>
                            <label className="grid gap-2 text-sm text-stone-600">
                              <span className="font-medium text-stone-900">Eindtijd</span>
                              <input type="time" value={editingEntryForm.endTime} onChange={(event) => setEditingEntryForm((current) => ({ ...current, endTime: event.target.value }))} className="sumo-input rounded-2xl px-4 py-3 outline-none transition" />
                            </label>
                            <label className="grid gap-2 text-sm text-stone-600">
                              <span className="font-medium text-stone-900">Pauze (min)</span>
                              <input type="number" min="0" step="5" value={editingEntryForm.breakMinutes} onChange={(event) => setEditingEntryForm((current) => ({ ...current, breakMinutes: event.target.value }))} className="sumo-input rounded-2xl px-4 py-3 outline-none transition" />
                            </label>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button type="button" onClick={saveEditedEntry} disabled={isUpdatingEntry} className="sumo-dark-button rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60">
                              {isUpdatingEntry ? 'Opslaan...' : 'Wijziging opslaan'}
                            </button>
                            <button type="button" onClick={cancelEditingEntry} className="sumo-ghost-button rounded-2xl px-4 py-2 text-sm font-semibold transition">
                              Annuleren
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-stone-900">{row.employeeName}</p>
                            <p className="mt-1 text-sm text-stone-500">{row.workDate} · {row.startTime} - {row.endTime}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-[#8c6a2f]">{row.totalHours.toFixed(2)} uur</p>
                            <p className="text-xs text-stone-500">Pauze {row.breakMinutes} min</p>
                            <div className="mt-3 flex flex-wrap justify-end gap-2">
                              <button type="button" onClick={() => startEditingEntry(row)} className="sumo-ghost-button rounded-2xl px-3 py-2 text-xs font-semibold transition">
                                Bewerken
                              </button>
                              <button type="button" onClick={() => removeEntry(row.id)} className="sumo-light-button rounded-2xl px-3 py-2 text-xs font-semibold transition">
                                Verwijderen
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Registraties deze maand</p>
                                <p className="mt-1 font-medium text-stone-900">{summary.entryCount}</p>
                              </div>
                              <button type="button" onClick={() => handleEmployeeMonthReport(summary)} className="sumo-ghost-button rounded-2xl px-4 py-2 text-sm font-semibold transition">
                                Maandrapport PDF
                              </button>
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
        </div>
      </div>
    </main>
  )
}
