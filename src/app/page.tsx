'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { defaultEmployees, type EmployeeRecord } from '@/lib/hours-data'
import { getEmployees, loginEmployee } from '@/lib/supabase-hours'

export default function Home() {
  const router = useRouter()
  const [employees, setEmployees] = useState<EmployeeRecord[]>(defaultEmployees)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [employeePin, setEmployeePin] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getEmployees()
        if (data.length) setEmployees(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoadingEmployees(false)
      }
    }

    loadEmployees()
  }, [])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedEmployee) {
      setLoginError('Kies eerst een medewerker.')
      return
    }

    if (!/^\d{4}$/.test(employeePin)) {
      setLoginError('Vul een 4-cijferige pincode in.')
      return
    }

    try {
      await loginEmployee(selectedEmployee, employeePin)
      setLoginError('')
      router.push(`/uren?employee=${selectedEmployee}`)
    } catch (error) {
      console.error(error)
      setLoginError(error instanceof Error ? error.message : 'Er ging iets mis bij het inloggen.')
    }
  }

  return (
    <main className="sumo-shell min-h-screen px-4 py-10 text-stone-900 md:px-6 md:py-14">
      <div className="mx-auto max-w-5xl rounded-[2rem] sumo-card border-[rgba(97,74,42,0.16)] bg-[rgba(255,251,244,0.9)] p-6 shadow-[0_24px_70px_rgba(86,63,34,0.16)] md:p-10">
        <div className="mb-10 max-w-3xl rounded-[1.75rem] border border-[rgba(182,144,77,0.16)] bg-[rgba(255,252,247,0.88)] px-5 py-6 shadow-[0_12px_30px_rgba(86,63,34,0.06)] md:px-7">
          <div className="mb-4 flex justify-end">
            <Link
              href="/"
              className="sumo-ghost-button rounded-2xl px-4 py-2 text-sm font-semibold transition"
            >
              Naar home
            </Link>
          </div>
          <p className="sumo-label mb-3 text-[0.7rem] text-[#8f714d]">SUMO Sushi Rotterdam Markthal</p>
          <div className="mb-5 h-[2px] w-20 rounded-full bg-gradient-to-r from-[#9f7d49] via-[#ccb184] to-transparent" />
          <h1 className="font-display text-4xl font-semibold leading-none text-[#2f2418] md:text-6xl">Welkom terug</h1>
          <p className="mt-4 text-base leading-relaxed text-[#4f4031] md:text-lg">
            Kies je naam, vul je pincode in en ga direct door naar je urenregistratie. Nieuwe medewerker? Maak hieronder eerst een nieuw account aan.
          </p>
        </div>

        <div className="sumo-paper-card rounded-[1.75rem] p-6 md:p-8">
          <p className="sumo-label">Inloggen medewerker</p>
          <h2 className="mt-2 font-display text-3xl text-stone-900">Selecteer medewerker</h2>
          <p className="sumo-muted mt-3 text-sm">Kies je naam en vul je 4-cijferige pincode in om je uren te registreren.</p>

          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <select
              value={selectedEmployee}
              onChange={(event) => setSelectedEmployee(event.target.value)}
              disabled={isLoadingEmployees}
              className="sumo-input-light w-full rounded-2xl px-4 py-3 outline-none transition"
            >
              <option value="">{isLoadingEmployees ? 'Medewerkers laden...' : 'Kies medewerker'}</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>

            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={employeePin}
              onChange={(event) => setEmployeePin(event.target.value)}
              placeholder="Pincode"
              className="sumo-input-light w-full rounded-2xl px-4 py-3 outline-none transition"
            />

            <div className="grid gap-3 md:grid-cols-3">
              <button
                type="submit"
                className="sumo-dark-button rounded-2xl px-5 py-3 text-base font-semibold transition"
              >
                Verder naar uren
              </button>

              <Link
                href="/register"
                className="sumo-light-button rounded-2xl px-5 py-3 text-center text-base font-semibold transition"
              >
                Nieuwe medewerker
              </Link>

              <Link
                href="/admin"
                className="sumo-ghost-button rounded-2xl px-5 py-3 text-center text-base font-semibold transition"
              >
                Admin
              </Link>
            </div>
          </form>

          {loginError ? (
            <div className="sumo-danger mt-4 rounded-2xl px-4 py-3 text-sm">
              {loginError}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}
