'use client'

import { useEffect, useMemo, useState } from 'react'
import { type EmployeeRecord } from '@/lib/hours-data'
import { createEmployee, getEmployees, getTimeEntries, type TimeEntry } from '@/lib/supabase-hours'

const DEFAULT_ADMIN_PIN = '2580'
const ADMIN_PIN_STORAGE_KEY = 'sumo-uren-admin-auth'

export default function AdminPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState('')
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingEmployee, setIsSavingEmployee] = useState(false)

  const adminPin = process.env.NEXT_PUBLIC_ADMIN_PIN || DEFAULT_ADMIN_PIN
  const totalHours = useMemo(() => entries.reduce((sum, row) => sum + row.totalHours, 0), [entries])

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

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-stone-950 px-4 py-10 text-stone-100">
        <div className="mx-auto flex min-h-[80vh] max-w-lg items-center">
          <div className="w-full rounded-3xl border border-amber-500/20 bg-stone-900/80 p-8 shadow-2xl shadow-black/30 backdrop-blur">
            <p className="mb-2 text-sm uppercase tracking-[0.3em] text-amber-400">Admin beveiliging</p>
            <h1 className="font-display text-4xl text-stone-50">Voer je pincode in</h1>
            <p className="mt-3 text-sm text-stone-300">
              De admin pagina is afgeschermd. Vul je pincode in om het urenoverzicht te openen.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleUnlock}>
              <input
                type="password"
                inputMode="numeric"
                value={pinInput}
                onChange={(event) => setPinInput(event.target.value)}
                placeholder="Pincode"
                className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-4 text-lg tracking-[0.3em] text-stone-100 outline-none transition focus:border-amber-400"
              />
              <button
                type="submit"
                className="w-full rounded-2xl bg-amber-400 px-5 py-4 text-base font-semibold text-stone-950 transition hover:bg-amber-300"
              >
                Open admin
              </button>
            </form>

            {pinError ? (
              <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {pinError}
              </div>
            ) : null}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-10 text-stone-100">
      <div className="mx-auto max-w-6xl rounded-3xl border border-amber-500/20 bg-stone-900/80 p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.3em] text-amber-400">Admin</p>
            <h1 className="font-display text-4xl text-stone-50 md:text-5xl">Uren overzicht</h1>
            <p className="mt-3 text-sm text-stone-300 md:text-base">
              Alleen voor jou zichtbaar. Hier zie je alle ingevoerde uren en beheer je ook de medewerkerslijst.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">Totaal uren</p>
            <p className="mt-1 text-3xl font-semibold text-stone-50">{totalHours.toFixed(2)} uur</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr,0.95fr]">
          <section className="overflow-hidden rounded-3xl border border-stone-800">
            <table className="min-w-full divide-y divide-stone-800 text-left text-sm">
              <thead className="bg-stone-950/80 text-stone-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Naam</th>
                  <th className="px-4 py-3 font-medium">Datum</th>
                  <th className="px-4 py-3 font-medium">Begin</th>
                  <th className="px-4 py-3 font-medium">Einde</th>
                  <th className="px-4 py-3 font-medium">Pauze</th>
                  <th className="px-4 py-3 font-medium">Totaal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 bg-stone-900/60 text-stone-100">
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-4 text-stone-400" colSpan={6}>Gegevens laden...</td>
                  </tr>
                ) : entries.length ? (
                  entries.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3">{row.employeeName}</td>
                      <td className="px-4 py-3">{row.workDate}</td>
                      <td className="px-4 py-3">{row.startTime}</td>
                      <td className="px-4 py-3">{row.endTime}</td>
                      <td className="px-4 py-3">{row.breakMinutes} min</td>
                      <td className="px-4 py-3 font-medium text-amber-300">{row.totalHours.toFixed(2)} uur</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-4 text-stone-400" colSpan={6}>Nog geen uren opgeslagen.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <aside className="rounded-3xl border border-stone-800 bg-stone-950/60 p-5">
            <div>
              <h2 className="font-display text-3xl text-stone-50">Medewerkers beheren</h2>
              <p className="mt-2 text-sm text-stone-300">
                Voeg hier ook direct een nieuwe medewerker toe.
              </p>
            </div>

            <form className="mt-5 space-y-3" onSubmit={handleAddEmployee}>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Voornaam"
                  className="rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-400"
                />
                <input
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Achternaam"
                  className="rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-400"
                />
              </div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                placeholder="Pincode (4 cijfers)"
                className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={isSavingEmployee}
                className="w-full rounded-2xl bg-amber-400 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-300 disabled:opacity-60"
              >
                {isSavingEmployee ? 'Bezig met toevoegen...' : 'Medewerker toevoegen'}
              </button>
            </form>

            {message ? (
              <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {message}
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between rounded-2xl border border-stone-800 bg-stone-900/80 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-stone-100">{employee.name}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-400">ID: {employee.id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmployee(employee.id)}
                    className="rounded-xl border border-red-500/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-300 transition hover:bg-red-500/10"
                  >
                    Verwijderen
                  </button>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
