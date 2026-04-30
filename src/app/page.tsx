import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-10 text-rose-950">
      <div className="mx-auto flex min-h-[80vh] max-w-4xl flex-col justify-center rounded-[2rem] border border-rose-200/80 bg-white/80 p-8 shadow-[0_24px_80px_rgba(244,114,182,0.16)] backdrop-blur md:p-12">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-rose-400">Sumo urenregistratie</p>
        <h1 className="font-display text-4xl text-rose-950 md:text-6xl">Een lichte sakura plek voor je urenregistratie</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-rose-900/70 md:text-lg">
          Medewerkers vullen na hun dienst hun begin- en eindtijd in, plus pauze. De app berekent direct het totaal aantal gewerkte uren in een rustige, heldere omgeving.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/uren"
            className="rounded-2xl bg-gradient-to-r from-rose-400 to-pink-400 px-6 py-4 text-center text-base font-semibold text-white transition hover:scale-[1.01]"
          >
            Open medewerker pagina
          </Link>
          <Link
            href="/admin"
            className="rounded-2xl border border-rose-300 bg-white/70 px-6 py-4 text-center text-base font-semibold text-rose-500 transition hover:bg-rose-50"
          >
            Open admin pagina
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-rose-400">1. Invullen</p>
            <p className="mt-2 text-sm text-rose-900/70">Naam, datum, begintijd, eindtijd en pauze invoeren.</p>
          </div>
          <div className="rounded-2xl border border-pink-100 bg-pink-50/80 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-pink-400">2. Berekenen</p>
            <p className="mt-2 text-sm text-rose-900/70">De app laat automatisch het totaal aantal uren zien.</p>
          </div>
          <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50/80 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-fuchsia-400">3. Beheren</p>
            <p className="mt-2 text-sm text-rose-900/70">Via admin zie jij uren en kun je medewerkers beheren.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
