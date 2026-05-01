'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createEmployee, getEmployees, getTimeEntries } from '@/lib/supabase-hours'
import { type EmployeeRecord } from '@/lib/hours-data'

export default function AdminSettingsPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [latestRegistration, setLatestRegistration] = useState('Nog geen registraties')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState('')
  const [isSavingEmployee, setIsSavingEmployee] = useState(false)

  const loadData = async () => {
    try {
      const [employeesData, entriesData] = await Promise.all([
        getEmployees({ includeInactive: true }),
        getTimeEntries(),
      ])
      setEmployees(employeesData)
      setLatestRegistration(entriesData[0] ? `${entriesData[0].employeeName} · ${entriesData[0].workDate}` : 'Nog geen registraties')
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : 'Kon instellingen niet laden.')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

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
      await loadData()
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : 'Er ging iets mis bij toevoegen.')
    } finally {
      setIsSavingEmployee(false)
    }
  }

  return (
    <main className="sumo-shell min-h-screen px-4 py-10 text-stone-900 md:px-6 md:py-14">
      <div className="mx-auto max-w-4xl rounded-[2rem] sumo-card border-[rgba(97,74,42,0.16)] bg-[rgba(255,251,244,0.9)] p-6 shadow-[0_24px_70px_rgba(86,63,34,0.16)] md:p-10">
        <div className="rounded-[1.75rem] border border-[rgba(182,144,77,0.16)] bg-[rgba(255,252,247,0.88)] px-5 py-6 shadow-[0_12px_30px_rgba(86,63,34,0.06)] md:px-7">
          <div className="mb-4 flex justify-end gap-3">
            <Link href="/admin" className="sumo-ghost-button rounded-2xl px-4 py-2 text-sm font-semibold transition">
              Terug naar admin
            </Link>
            <Link href="/" className="sumo-ghost-button rounded-2xl px-4 py-2 text-sm font-semibold transition">
              Naar home
            </Link>
          </div>
          <p className="sumo-label mb-3 text-[0.7rem] text-[#8f714d]">Instellingen</p>
          <h1 className="font-display text-4xl font-semibold leading-none text-[#2f2418] md:text-5xl">Admin instellingen</h1>
          <div className="mt-4 h-[2px] w-20 rounded-full bg-gradient-to-r from-[#9f7d49] via-[#ccb184] to-transparent" />
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#4f4031] md:text-base">
            Eén plek voor medewerker toevoegen en snelle dashboardinformatie.
          </p>
        </div>

        {message ? <div className="sumo-success mt-6 rounded-2xl px-4 py-3 text-sm">{message}</div> : null}

        <div className="mt-8 grid gap-6">
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
                <span className="font-medium text-stone-900">Laatste registratie:</span> {latestRegistration}
              </div>
              <div className="sumo-panel rounded-2xl px-4 py-3">
                <span className="font-medium text-stone-900">Medewerkers:</span> {employees.length} medewerker(s)
              </div>
              <div className="sumo-panel rounded-2xl px-4 py-3">
                <span className="font-medium text-stone-900">Admin status:</span> Ontgrendeld
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
