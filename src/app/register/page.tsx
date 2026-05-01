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
    <main className="sumo-shell min-h-screen px-4 py-10 text-stone-900 md:px-6 md:py-14">
      <div className="mx-auto max-w-3xl rounded-[2rem] sumo-card border-[rgba(97,74,42,0.16)] bg-[rgba(255,251,244,0.9)] p-6 shadow-[0_24px_70px_rgba(86,63,34,0.16)] md:p-10">
        <div className="mb-8 rounded-[1.75rem] border border-[rgba(182,144,77,0.16)] bg-[rgba(255,252,247,0.88)] px-5 py-6 shadow-[0_12px_30px_rgba(86,63,34,0.06)] md:px-7">
          <div className="mb-4 flex justify-end">
            <Link
              href="/"
              className="sumo-ghost-button rounded-2xl px-4 py-2 text-sm font-semibold transition"
            >
              Naar home
            </Link>
          </div>
          <p className="sumo-label mb-3 text-[0.7rem] text-[#8f714d]">Nieuwe medewerker</p>
          <h1 className="font-display text-4xl font-semibold leading-none text-[#2f2418] md:text-5xl">Account aanmaken</h1>
          <div className="mt-4 h-[2px] w-20 rounded-full bg-gradient-to-r from-[#9f7d49] via-[#ccb184] to-transparent" />
          <p className="mt-4 text-sm leading-relaxed text-[#4f4031] md:text-base">
            Vul voornaam, achternaam en een 4-cijferige pincode in. Daarna kun je via de homepage inloggen.
          </p>
        </div>

        <div className="sumo-paper-card rounded-[1.75rem] p-6 md:p-8">
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="grid gap-4 md:grid-cols-2">
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

            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(event) => setNewPin(event.target.value)}
                placeholder="Pincode (4 cijfers)"
                className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition"
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(event) => setConfirmPin(event.target.value)}
                placeholder="Controle pincode"
                className="sumo-input w-full rounded-2xl px-4 py-3 outline-none transition"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="submit"
                disabled={isRegistering}
                className="sumo-dark-button rounded-2xl px-5 py-3 text-base font-semibold transition disabled:opacity-60"
              >
                {isRegistering ? 'Bezig met opslaan...' : 'Nieuwe medewerker aanmaken'}
              </button>

              <Link
                href="/"
                className="sumo-ghost-button rounded-2xl px-5 py-3 text-center text-base font-semibold transition"
              >
                Terug naar homepage
              </Link>
            </div>
          </form>

          {registerError ? (
            <div className="sumo-danger mt-4 rounded-2xl px-4 py-3 text-sm">
              {registerError}
            </div>
          ) : null}

          {registerMessage ? (
            <div className="sumo-success mt-4 rounded-2xl px-4 py-3 text-sm">
              {registerMessage}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}
