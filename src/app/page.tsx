import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-950 px-4 py-10 text-stone-100">
      <div className="mx-auto flex min-h-[80vh] max-w-4xl flex-col justify-center rounded-3xl border border-amber-500/20 bg-stone-900/80 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-12">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-amber-400">Sumo urenregistratie</p>
        <h1 className="font-display text-4xl text-stone-50 md:text-6xl">Simpel uren invullen voor je team</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-300 md:text-lg">
          Medewerkers vullen na hun dienst hun begin- en eindtijd in, plus pauze. De app berekent direct het totaal aantal gewerkte uren.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/uren"
            className="rounded-2xl bg-amber-400 px-6 py-4 text-center text-base font-semibold text-stone-950 transition hover:bg-amber-300"
          >
            Open medewerker pagina
          </Link>
          <Link
            href="/admin"
            className="rounded-2xl border border-amber-400/40 px-6 py-4 text-center text-base font-semibold text-amber-200 transition hover:bg-amber-400/10"
          >
            Open admin pagina
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">1. Invullen</p>
            <p className="mt-2 text-sm text-stone-300">Naam, datum, begintijd, eindtijd en pauze invoeren.</p>
          </div>
          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">2. Berekenen</p>
            <p className="mt-2 text-sm text-stone-300">De app laat automatisch het totaal aantal uren zien.</p>
          </div>
          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">3. Beheren</p>
            <p className="mt-2 text-sm text-stone-300">Via admin zie jij uren en kun je medewerkers beheren.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
