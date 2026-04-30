'use client'

import { useEffect, useMemo, useState } from 'react'
import { defaultEmployees, type EmployeeRecord } from '@/lib/hours-data'
import { createTimeEntry, getEmployeeMonthlyEntries, getEmployees, type TimeEntry } from '@/lib/supabase-hours'

const today = new Date().toISOString().split('T')[0]
function getMonthKey(dateValue: string) {
  return dateValue.slice(0, 7)
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)
}

function calculateHours(start: string, end: string, breakMinutes: number) {
  if (!isValidTime(start) || !isValidTime(end)) return 0

  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)

  const startTotal = startHour * 60 + startMinute
  const endTotal = endHour * 60 + endMinute
  const workedMinutes = Math.max(endTotal - startTotal - breakMinutes, 0)

  return workedMinutes / 60
}

function formatWorkDate(value: string) {
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export default function UrenPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>(defaultEmployees)
  const [employeeId, setEmployeeId] = useState('')
  const [date, setDate] = useState(today)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [breakMinutes, setBreakMinutes] = useState('30')
  const [saved, setSaved] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [monthlyEntries, setMonthlyEntries] = useState<TimeEntry[]>([])
  const [isLoadingMonthlyEntries, setIsLoadingMonthlyEntries] = useState(false)

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getEmployees()
        if (data.length) setEmployees(data)
      } catch (error) {
        console.error(error)
      }
    }

    loadEmployees()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const employeeFromQuery = params.get('employee') || ''
    if (employeeFromQuery) {
      setEmployeeId(employeeFromQuery)
    }
  }, [])

  useEffect(() => {
    const loadMonthlyEntries = async () => {
      if (!employeeId) {
        setMonthlyEntries([])
        return
      }

      setIsLoadingMonthlyEntries(true)
      try {
        const data = await getEmployeeMonthlyEntries(employeeId, getMonthKey(date))
        setMonthlyEntries(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoadingMonthlyEntries(false)
      }
    }

    loadMonthlyEntries()
  }, [employeeId, date])

  const totalHours = useMemo(() => {
    return calculateHours(startTime, endTime, Number(breakMinutes) || 0)
  }, [startTime, endTime, breakMinutes])

  const monthlyTotalHours = useMemo(() => {
    return monthlyEntries.reduce((sum, entry) => sum + entry.totalHours, 0)
  }, [monthlyEntries])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveError('')
    setSaveMessage('')

    if (!employeeId) {
      setSaveError('Kies eerst een medewerker.')
      return
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      setSaveError('Vul begintijd en eindtijd in als HH:MM, bijvoorbeeld 11:30.')
      return
    }

    setIsSaving(true)

    try {
      await createTimeEntry({
        employeeId,
        date,
        startTime,
        endTime,
        breakMinutes: Number(breakMinutes) || 0,
      })

      setSaved(false)
      setSaveMessage('')
      setSaveMessage('Uren zijn opgeslagen.')
      const refreshedEntries = await getEmployeeMonthlyEntries(employeeId, getMonthKey(date))
      setMonthlyEntries(refreshedEntries)
      setSaved(true)
      setStartTime('')
      setEndTime('')
    } catch (error) {
      console.error(error)
      setSaved(false)
      setSaveError(error instanceof Error ? error.message : 'Er ging iets mis bij het opslaan.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="sumo-shell min-h-screen px-4 py-10 text-stone-100 md:px-6 md:py-14">
      <div className="mx-auto max-w-5xl rounded-[2rem] sumo-card p-6 backdrop-blur md:p-10">
        <div className="mb-8">
          <p className="sumo-label mb-2">SUMO Sushi Rotterdam Markthal</p>
          <h1 className="font-display text-4xl text-stone-50 md:text-5xl">Uren registreren</h1>
          <div className="sumo-divider mt-4" />
          <p className="sumo-muted mt-4 text-sm md:text-base">
            Vul na je dienst je begin- en eindtijd in. Daaronder zie je ook meteen jouw uren van deze maand.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,0.95fr]">
          <section>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">Naam medewerker</label>
                <select
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition"
                >
                  <option value="">Kies je naam</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">Datum</label>
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">Pauze (minuten)</label>
                  <input
                    min="0"
                    step="5"
                    type="number"
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(e.target.value)}
                    className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">Begintijd</label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="11:30"
                    className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">Eindtijd</label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="22:00"
                    className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition"
                  />
                </div>
              </div>

              <div className="sumo-soft-panel rounded-2xl p-5">
                <p className="sumo-soft-panel-title text-sm uppercase tracking-[0.25em]">Totaal gewerkte uren</p>
                <p className="mt-2 text-4xl font-semibold text-stone-900">{totalHours.toFixed(2)} uur</p>
                <p className="sumo-soft-panel-text mt-2 text-sm">Begintijd - eindtijd - pauze = totaal aantal uren</p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="sumo-dark-button w-full rounded-2xl px-5 py-3 text-base font-semibold transition disabled:opacity-60"
              >
                {isSaving ? 'Bezig met opslaan...' : 'Uren opslaan'}
              </button>
            </form>

            {saveMessage ? (
              <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                {saveMessage}
              </div>
            ) : null}

            {saveError ? (
              <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
                {saveError}
              </div>
            ) : null}

            {saved ? null : null}
          </section>

          <aside className="rounded-3xl border border-white/5 bg-black/25 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-amber-300">Jouw uren deze maand</p>
                <h2 className="mt-2 font-display text-3xl text-stone-50">Maandoverzicht</h2>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Totaal maand</p>
                <p className="text-2xl font-semibold text-stone-50">{monthlyTotalHours.toFixed(2)} uur</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {isLoadingMonthlyEntries ? (
                <div className="rounded-2xl border border-stone-800 bg-stone-900/80 px-4 py-4 text-sm text-stone-400">
                  Uren laden...
                </div>
              ) : monthlyEntries.length ? (
                monthlyEntries.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-stone-800 bg-stone-900/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-stone-100">{formatWorkDate(entry.workDate)}</p>
                        <p className="mt-1 text-sm text-stone-400">
                          {entry.startTime} - {entry.endTime} · Pauze {entry.breakMinutes} min
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-amber-300">{entry.totalHours.toFixed(2)} uur</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-stone-800 bg-stone-900/80 px-4 py-4 text-sm text-stone-400">
                  Nog geen uren deze maand.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
