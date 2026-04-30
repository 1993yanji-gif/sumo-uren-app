'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { createEmployee } from '@/lib/supabase-hours'

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [registerMessage, setRegisterMessage] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
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

    setIsRegistering(true)
    setRegisterError('')
    setRegisterMessage('')

    try {
      const employee = await createEmployee(cleanFirstName, cleanLastName, newPin)
      setFirstName('')
      setLastName('')
      setNewPin('')
      setConfirmPin('')
      setRegisterMessage(`${employee.name} is opgeslagen. Je kunt nu terug naar de homepage om in te loggen.`)
    } catch (error) {
      console.error(error)
      setRegisterError(error instanceof Error ? error.message : 'Er ging iets mis bij het aanmaken.')
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-10 text-stone-100">
      <div className="mx-auto max-w-2xl rounded-3xl border border-amber-500/20 bg-stone-900/80 p-6 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
        <div className="mb-8">
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-amber-400">Nieuwe medewerker</p>
          <h1 className="font-display text-4xl text-stone-50 md:text-5xl">Account aanmaken</h1>
          <p className="mt-3 text-sm text-stone-300 md:text-base">
            Vul voornaam, achternaam en een 4-cijferige pincode in. Daarna kun je via de homepage inloggen.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleRegister}>
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

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="submit"
              disabled={isRegistering}
              className="rounded-2xl bg-amber-400 px-5 py-3 text-base font-semibold text-stone-950 transition hover:bg-amber-300 disabled:opacity-60"
            >
              {isRegistering ? 'Bezig met opslaan...' : 'Nieuwe medewerker aanmaken'}
            </button>

            <Link
              href="/"
              className="rounded-2xl border border-stone-700 px-5 py-3 text-center text-base font-semibold text-stone-200 transition hover:bg-stone-800"
            >
              Terug naar homepage
            </Link>
          </div>
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
      </div>
    </main>
  )
}
