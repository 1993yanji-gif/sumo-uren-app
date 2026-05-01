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
  const [resetPinValues, setResetPinValues] = useState<Record<string, string>>({})
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingEmployee, setIsSavingEmployee] = useState(false)
  const [isUpdatingPinFor, setIsUpdatingPinFor] = useState<string | null>(null)

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
      <div className="mx-auto max-w-6xl rounded-[2rem] sumo-card border-[rgba(97,74,42,0.16)] bg-[rgba(255,251,244,0.9)] p-6 shadow-[0_24px_70px_rgba(86,63,34,0.16)] md:p-10">
        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-[rgba(182,144,77,0.16)] bg-[rgba(255,252,247,0.88)] px-5 py-6 shadow-[0_12px_30px_rgba(86,63,34,0.06)] md:flex-row md:items-end md:justify-between md:px-7">
          <div>
            <p className="sumo-label mb-3 text-[0.7rem] text-[#8f714d]">Admin</p>
            <h1 className="font-display text-4xl font-semibold leading-none text-[#2f2418] md:text-5xl">Uren overzicht</h1>
            <div className="mt-4 h-[2px] w-20 rounded-full bg-gradient-to-r from-[#9f7d49] via-[#ccb184] to-transparent" />
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#4f4031] md:text-base">
              Alleen voor jou zichtbaar. Hier zie je alle ingevoerde uren en beheer je ook de medewerkerslijst.
            </p>
          </div>
          <div className="sumo-soft-panel rounded-2xl px-5 py-4">
            <p className="sumo-soft-panel-title text-sm uppercase tracking-[0.2em]">Totaal uren</p>
            <p className="mt-1 text-3xl font-semibold text-stone-900">{totalHours.toFixed(2)} uur</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr,0.95fr]">
          <section className="sumo-table overflow-hidden rounded-[1.75rem]">
            <table className="min-w-full divide-y divide-[rgba(97,74,42,0.08)] text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 font-medium">Naam</th>
                  <th className="px-4 py-3 font-medium">Datum</th>
                  <th className="px-4 py-3 font-medium">Begin</th>
                  <th className="px-4 py-3 font-medium">Einde</th>
                  <th className="px-4 py-3 font-medium">Pauze</th>
                  <th className="px-4 py-3 font-medium">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-4 text-stone-500" colSpan={6}>Gegevens laden...</td>
                  </tr>
                ) : entries.length ? (
                  entries.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3">{row.employeeName}</td>
                      <td className="px-4 py-3">{row.workDate}</td>
                      <td className="px-4 py-3">{row.startTime}</td>
                      <td className="px-4 py-3">{row.endTime}</td>
                      <td className="px-4 py-3">{row.breakMinutes} min</td>
                      <td className="px-4 py-3 font-medium text-[#8c6a2f]">{row.totalHours.toFixed(2)} uur</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-4 text-stone-500" colSpan={6}>Nog geen uren opgeslagen.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <aside className="sumo-paper-card rounded-[1.75rem] p-5 md:p-6">
            <div>
              <h2 className="font-display text-3xl text-stone-900">Medewerkers beheren</h2>
              <p className="sumo-muted mt-2 text-sm">
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

            {message ? (
              <div className="sumo-success mt-4 rounded-2xl px-4 py-3 text-sm">
                {message}
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="sumo-panel rounded-2xl px-4 py-4"
                >
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
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
