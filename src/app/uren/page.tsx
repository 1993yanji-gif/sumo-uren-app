'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { type EmployeeRecord } from '@/lib/hours-data'
import { createTimeEntry, getEmployeeMonthlyEntries, getEmployees, type TimeEntry } from '@/lib/supabase-hours'
import { exportToCsv, exportToExcel, exportToPdf, mapEntriesForExport } from '@/lib/export-utils'

const today = new Date().toISOString().split('T')[0]

function getMonthKey(dateValue: string) {
  return dateValue.slice(0, 7)
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)
}

function toMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function getValidation(start: string, end: string, breakMinutes: number) {
  if (!start || !end) {
    return {
      isValid: false,
      fieldErrors: {
        startTime: start ? '' : 'Vul een begintijd in.',
        endTime: end ? '' : 'Vul een eindtijd in.',
        breakMinutes: '',
      },
      warning: '',
      totalHours: 0,
    }
  }

  if (!isValidTime(start) || !isValidTime(end)) {
    return {
      isValid: false,
      fieldErrors: {
        startTime: !isValidTime(start) ? 'Vul een geldige begintijd in.' : '',
        endTime: !isValidTime(end) ? 'Vul een geldige eindtijd in.' : '',
        breakMinutes: '',
      },
      warning: '',
      totalHours: 0,
    }
  }

  const startTotal = toMinutes(start)
  const endTotal = toMinutes(end)
  const shiftMinutes = endTotal - startTotal

  if (shiftMinutes <= 0) {
    return {
      isValid: false,
      fieldErrors: {
        startTime: '',
        endTime: 'Eindtijd moet later zijn dan begintijd.',
        breakMinutes: '',
      },
      warning: '',
      totalHours: 0,
    }
  }

  if (breakMinutes < 0) {
    return {
      isValid: false,
      fieldErrors: {
        startTime: '',
        endTime: '',
        breakMinutes: 'Pauze mag niet negatief zijn.',
      },
      warning: '',
      totalHours: 0,
    }
  }

  if (breakMinutes >= shiftMinutes) {
    return {
      isValid: false,
      fieldErrors: {
        startTime: '',
        endTime: '',
        breakMinutes: 'Pauze mag niet groter zijn dan de dienstduur.',
      },
      warning: '',
      totalHours: 0,
    }
  }

  const totalHours = (shiftMinutes - breakMinutes) / 60
  const warning = totalHours > 12 ? 'Let op: dit is een extreem lange shift.' : totalHours > 10 ? 'Let op: controleer of deze lange shift klopt.' : ''

  return {
    isValid: true,
    fieldErrors: {
      startTime: '',
      endTime: '',
      breakMinutes: '',
    },
    warning,
    totalHours,
  }
}

function formatWorkDate(value: string) {
  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export default function UrenPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [employeeLoadError, setEmployeeLoadError] = useState('')
  const [date, setDate] = useState(today)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [breakMinutes, setBreakMinutes] = useState('30')
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
        setEmployeeLoadError('Kon medewerker niet laden uit Supabase.')
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

  const validation = useMemo(() => {
    return getValidation(startTime, endTime, Number(breakMinutes) || 0)
  }, [startTime, endTime, breakMinutes])

  const monthlyTotalHours = useMemo(() => {
    return monthlyEntries.reduce((sum, entry) => sum + entry.totalHours, 0)
  }, [monthlyEntries])

  const selectedEmployeeName = useMemo(() => {
    return employees.find((employee) => employee.id === employeeId)?.name || 'Medewerker'
  }, [employees, employeeId])

  const handleEmployeeExport = (type: 'csv' | 'excel' | 'pdf') => {
    if (!monthlyEntries.length) {
      setSaveError('Er zijn geen uren om te exporteren.')
      return
    }

    const rows = mapEntriesForExport(monthlyEntries)
    const monthKey = getMonthKey(date)
    const safeName = selectedEmployeeName.toLowerCase().replace(/\s+/g, '-')
    const baseFilename = `maandoverzicht-${safeName}-${monthKey}`

    if (type === 'csv') {
      exportToCsv(rows, `${baseFilename}.csv`)
      return
    }

    if (type === 'excel') {
      exportToExcel(rows, `${baseFilename}.xlsx`)
      return
    }

    exportToPdf(rows, `${baseFilename}.pdf`, `Maandoverzicht ${selectedEmployeeName} · ${monthKey}`)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveError('')
    setSaveMessage('')

    if (!employeeId) {
      setSaveError('Kies eerst een medewerker.')
      return
    }

    if (!validation.isValid) {
      setSaveError('Controleer de ingevulde tijden en pauze.')
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

      setSaveMessage('Uren zijn opgeslagen.')
      const refreshedEntries = await getEmployeeMonthlyEntries(employeeId, getMonthKey(date))
      setMonthlyEntries(refreshedEntries)
      setStartTime('')
      setEndTime('')
    } catch (error) {
      console.error(error)
      setSaveError(error instanceof Error ? error.message : 'Er ging iets mis bij het opslaan.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="sumo-shell min-h-screen px-4 py-10 text-stone-900 md:px-6 md:py-14">
      <div className="mx-auto max-w-5xl rounded-[2rem] sumo-card border-[rgba(97,74,42,0.16)] bg-[rgba(255,251,244,0.9)] p-6 shadow-[0_24px_70px_rgba(86,63,34,0.16)] md:p-10">
        <div className="mb-8 rounded-[1.75rem] border border-[rgba(182,144,77,0.16)] bg-[rgba(255,252,247,0.88)] px-5 py-6 shadow-[0_12px_30px_rgba(86,63,34,0.06)] md:px-7">
          <div className="mb-4 flex justify-end">
            <Link href="/" className="sumo-ghost-button rounded-2xl px-4 py-2 text-sm font-semibold transition">
              Naar home
            </Link>
          </div>
          <p className="sumo-label mb-3 text-[0.7rem] text-[#8f714d]">SUMO Sushi Rotterdam Markthal</p>
          <h1 className="font-display text-4xl font-semibold leading-none text-[#2f2418] md:text-5xl">Uren registreren</h1>
          <div className="mt-4 h-[2px] w-20 rounded-full bg-gradient-to-r from-[#9f7d49] via-[#ccb184] to-transparent" />
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#4f4031] md:text-base">
            Vul na je dienst je begin- en eindtijd in. Daaronder zie je ook meteen jouw uren van deze maand.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,0.95fr]">
          <section className="sumo-paper-card rounded-[1.75rem] p-6 md:p-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="sumo-panel rounded-2xl px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Medewerker</p>
                <p className="mt-2 text-lg font-semibold text-stone-900">{selectedEmployeeName}</p>
                {employeeLoadError ? <p className="mt-2 text-sm text-red-600">{employeeLoadError}</p> : null}
                {!employeeId ? <p className="mt-2 text-sm text-red-600">Geen medewerker gekozen. Ga terug naar home en log opnieuw in.</p> : null}
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
                  {validation.fieldErrors.breakMinutes ? <p className="mt-2 text-sm text-red-600">{validation.fieldErrors.breakMinutes}</p> : null}
                  <div className="mt-3 flex gap-2">
                    {[15, 30].map((minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        onClick={() => setBreakMinutes(String(minutes))}
                        className="sumo-ghost-button rounded-2xl px-4 py-2 text-sm font-semibold transition"
                      >
                        {minutes} min
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">Begintijd</label>
                  <input
                    required
                    type="time"
                    step="60"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition"
                  />
                  {validation.fieldErrors.startTime ? <p className="mt-2 text-sm text-red-600">{validation.fieldErrors.startTime}</p> : null}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">Eindtijd</label>
                  <input
                    required
                    type="time"
                    step="60"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition"
                  />
                  {validation.fieldErrors.endTime ? <p className="mt-2 text-sm text-red-600">{validation.fieldErrors.endTime}</p> : null}
                </div>
              </div>

              <div className="sumo-soft-panel rounded-2xl p-5">
                <p className="sumo-soft-panel-title text-sm uppercase tracking-[0.25em]">Totaal gewerkte uren</p>
                <p className="mt-2 text-4xl font-semibold text-stone-900">{validation.totalHours.toFixed(2)} uur</p>
                <p className="sumo-soft-panel-text mt-2 text-sm">Begintijd - eindtijd - pauze = totaal aantal uren</p>
                {validation.warning ? <p className="mt-3 text-sm font-medium text-amber-700">{validation.warning}</p> : null}
              </div>

              <button
                type="submit"
                disabled={isSaving || !employeeId || !validation.isValid}
                className="sumo-dark-button w-full rounded-2xl px-5 py-3 text-base font-semibold transition disabled:opacity-60"
              >
                {isSaving ? 'Bezig met opslaan...' : 'Uren opslaan'}
              </button>
            </form>

            {saveMessage ? <div className="sumo-success mt-5 rounded-2xl p-4 text-sm">{saveMessage}</div> : null}
            {saveError ? <div className="sumo-danger mt-5 rounded-2xl p-4 text-sm">{saveError}</div> : null}
          </section>

          <aside className="sumo-panel rounded-[1.75rem] p-5 md:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="sumo-label">Jouw uren deze maand</p>
                <h2 className="mt-2 font-display text-3xl text-stone-900">Maandoverzicht</h2>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Totaal maand</p>
                <p className="text-2xl font-semibold text-stone-900">{monthlyTotalHours.toFixed(2)} uur</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => handleEmployeeExport('excel')} className="sumo-ghost-button rounded-2xl px-4 py-2 text-sm font-semibold transition">
                Exporteer Excel
              </button>
              <button type="button" onClick={() => handleEmployeeExport('pdf')} className="sumo-ghost-button rounded-2xl px-4 py-2 text-sm font-semibold transition">
                Exporteer PDF
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {isLoadingMonthlyEntries ? (
                <div className="sumo-paper-card rounded-2xl px-4 py-4 text-sm text-stone-500">Uren laden...</div>
              ) : monthlyEntries.length ? (
                monthlyEntries.map((entry) => (
                  <div key={entry.id} className="sumo-paper-card rounded-2xl px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-stone-900">{formatWorkDate(entry.workDate)}</p>
                        <p className="mt-1 text-sm text-stone-500">
                          {entry.startTime} - {entry.endTime} · Pauze {entry.breakMinutes} min
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-[#8c6a2f]">{entry.totalHours.toFixed(2)} uur</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="sumo-paper-card rounded-2xl px-4 py-4 text-sm text-stone-500">Nog geen uren deze maand.</div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
