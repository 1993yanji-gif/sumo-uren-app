'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { defaultEmployees, type EmployeeRecord } from '@/lib/hours-data'
import { apiUrl } from '@/lib/api-base'

type EmployeeApiRecord = {
  id: string
  firstName: string
  lastName: string
  name: string
}

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
        const response = await fetch(apiUrl('/api/employees'), { cache: 'no-store' })
        if (!response.ok) throw new Error('Kon medewerkers niet laden')
        const data = (await response.json()) as { employees: EmployeeApiRecord[] }
        if (data.employees?.length) {
          setEmployees(data.employees)
        }
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
      const response = await fetch(apiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedEmployee, pin: employeePin }),
      })

      if (!response.ok) {
        const data = await response.json()
        setLoginError(data.error || 'Inloggen mislukt.')
        return
      }

      setLoginError('')
      router.push(`/uren?employee=${selectedEmployee}`)
    } catch (error) {
      console.error(error)
      setLoginError('Er ging iets mis bij het inloggen.')
    }
  }

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-10 text-stone-100">
      <div className="mx-auto max-w-4xl rounded-3xl border border-amber-500/20 bg-stone-900/80 p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-amber-400">Sumo urenregistratie</p>
          <h1 className="font-display text-4xl text-stone-50 md:text-6xl">Welkom terug</h1>
          <p className="mt-4 text-base leading-relaxed text-stone-300 md:text-lg">
            Kies je naam, vul je pincode in en ga direct door naar je urenregistratie. Nieuwe medewerker? Maak hieronder eerst een nieuw account aan.
          </p>
        </div>

        <div className="rounded-3xl border border-stone-800 bg-stone-950/60 p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-300">Inloggen medewerker</p>
          <h2 className="mt-2 font-display text-3xl text-stone-50">Selecteer medewerker</h2>
          <p className="mt-3 text-sm text-stone-300">Kies je naam en vul je 4-cijferige pincode in om je uren te registreren.</p>

          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <select
              value={selectedEmployee}
              onChange={(event) => setSelectedEmployee(event.target.value)}
              disabled={isLoadingEmployees}
              className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-400"
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
              className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-400"
            />

            <div className="grid gap-3 md:grid-cols-3">
              <button
                type="submit"
                className="rounded-2xl bg-amber-400 px-5 py-3 text-base font-semibold text-stone-950 transition hover:bg-amber-300"
              >
                Verder naar uren
              </button>

              <Link
                href="/register"
                className="rounded-2xl border border-amber-400/40 px-5 py-3 text-center text-base font-semibold text-amber-200 transition hover:bg-amber-400/10"
              >
                Nieuwe medewerker
              </Link>

              <Link
                href="/admin"
                className="rounded-2xl border border-stone-700 px-5 py-3 text-center text-base font-semibold text-stone-200 transition hover:bg-stone-800"
              >
                Admin
              </Link>
            </div>
          </form>

          {loginError ? (
            <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {loginError}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}
