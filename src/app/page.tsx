'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { defaultEmployees, type EmployeeOption } from '@/lib/hours-data'

function createEmployeeId(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export default function Home() {
  const router = useRouter()
  const [employees, setEmployees] = useState<EmployeeOption[]>(defaultEmployees)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [employeePin, setEmployeePin] = useState('')
  const [loginError, setLoginError] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [registerMessage, setRegisterMessage] = useState('')
  const [registerError, setRegisterError] = useState('')

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedEmployee) {
      setLoginError('Kies eerst een medewerker.')
      return
    }

    if (!/^\d{4}$/.test(employeePin)) {
      setLoginError('Vul een 4-cijferige pincode in.')
      return
    }

    setLoginError('')
    router.push(`/uren?employee=${selectedEmployee}`)
  }

  const handleRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const cleanFirstName = firstName.trim()
    const cleanLastName = lastName.trim()

    if (!cleanFirstName || !cleanLastName) {
      setRegisterError('Vul voornaam en achternaam in.')
      return
    }

    if (!/^\d{4}$/.test(newPin)) {
      setRegisterError('Pincode moet uit 4 cijfers bestaan.')
      return
    }

    if (newPin !== confirmPin) {
      setRegisterError('Pincode en controle pincode zijn niet gelijk.')
      return
    }

    const name = `${cleanFirstName} ${cleanLastName}`
    const id = createEmployeeId(cleanFirstName, cleanLastName)
    const exists = employees.some((employee) => employee.id === id)

    if (exists) {
      setRegisterError('Deze medewerker bestaat al.')
      return
    }

    const nextEmployee = { id, name }
    setEmployees((current) => [...current, nextEmployee])
    setSelectedEmployee(id)
    setEmployeePin(newPin)
    setFirstName('')
    setLastName('')
    setNewPin('')
    setConfirmPin('')
    setRegisterError('')
    setRegisterMessage(`${name} is toegevoegd in deze demo. Je kunt nu direct inloggen.`)
  }

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-10 text-stone-100">
      <div className="mx-auto max-w-6xl rounded-3xl border border-amber-500/20 bg-stone-900/80 p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-amber-400">Sumo urenregistratie</p>
          <h1 className="font-display text-4xl text-stone-50 md:text-6xl">Login of maak een nieuwe medewerker aan</h1>
          <p className="mt-4 text-base leading-relaxed text-stone-300 md:text-lg">
            Medewerkers kiezen hun naam en vullen hun pincode in. Nog niet in de lijst? Dan kunnen ze zichzelf hieronder aanmaken met naam en een 4-cijferige pincode.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-stone-800 bg-stone-950/60 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-300">1. Selecteer medewerker</p>
            <h2 className="mt-2 font-display text-3xl text-stone-50">Inloggen</h2>
            <p className="mt-3 text-sm text-stone-300">Kies je naam en vul je 4-cijferige pincode in om je uren te registreren.</p>

            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <select
                value={selectedEmployee}
                onChange={(event) => setSelectedEmployee(event.target.value)}
                className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-400"
              >
                <option value="">Kies medewerker</option>
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

              <button
                type="submit"
                className="w-full rounded-2xl bg-amber-400 px-5 py-3 text-base font-semibold text-stone-950 transition hover:bg-amber-300"
              >
                Verder naar uren invullen
              </button>
            </form>

            {loginError ? (
              <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {loginError}
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-stone-800 bg-stone-950/60 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-300">2. Nieuwe medewerker</p>
            <h2 className="mt-2 font-display text-3xl text-stone-50">Account aanmaken</h2>
            <p className="mt-3 text-sm text-stone-300">
              Vul naam, achternaam en een 4-cijferige pincode in. In deze stap is het nog een demo-flow en wordt het nog niet permanent opgeslagen.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleRegister}>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Voornaam"
                  className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-400"
                />
                <input
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Achternaam"
                  className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-400"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(event) => setNewPin(event.target.value)}
                  placeholder="Pincode (4 cijfers)"
                  className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-400"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(event) => setConfirmPin(event.target.value)}
                  placeholder="Controle pincode"
                  className="w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl border border-amber-400/40 px-5 py-3 text-base font-semibold text-amber-200 transition hover:bg-amber-400/10"
              >
                Nieuwe medewerker aanmaken
              </button>
            </form>

            {registerError ? (
              <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {registerError}
              </div>
            ) : null}

            {registerMessage ? (
              <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {registerMessage}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  )
}
