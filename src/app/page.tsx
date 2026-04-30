'use client'

import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Cuisine from '@/components/Cuisine'
import Location from '@/components/Location'
import Contact from '@/components/Contact'

export default function Home() {
  return (
    <main className="bg-sumo-black">
      <Navigation />
      <Hero />
      <About />
      <Cuisine />
      <Location />
      <Contact />
    </main>
  )
}