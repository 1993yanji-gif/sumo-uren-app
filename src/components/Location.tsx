'use client'

import { motion } from 'framer-motion'

export default function Location() {
  return (
    <section id="location" className="relative py-32 bg-sumo-dark overflow-hidden">
      {/* Decorative element */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-sumo-gold/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop')`
                }}
              />
            </div>
            {/* Frame accent */}
            <div className="absolute -bottom-4 -right-4 w-full h-full border border-sumo-gold/20 -z-10" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {/* Label */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-px bg-sumo-gold" />
              <span className="text-sumo-gold text-sm tracking-widest uppercase">Location</span>
            </div>

            {/* Title */}
            <h2 className="font-display text-4xl lg:text-5xl font-light text-sumo-cream mb-8">
              Markthal<br />Rotterdam
            </h2>

            <p className="text-sumo-cream/70 text-lg leading-relaxed mb-10">
              SUMO is gevestigd in Rotterdam's iconische Markthal - een architectonisch 
              meesterwerk dat als thuisbasis dient voor de beste culinaire ervaringen.
            </p>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div>
                <h4 className="text-sumo-gold text-sm tracking-widest uppercase mb-2">Adres</h4>
                <p className="text-sumo-cream/70">
                  Dominee Jan Scharpstraat 298<br />
                  3011 GZ Rotterdam
                </p>
              </div>
              <div>
                <h4 className="text-sumo-gold text-sm tracking-widest uppercase mb-2">Openingstijden</h4>
                <p className="text-sumo-cream/70">
                  Ma - Do: 11:00 - 22:00<br />
                  Vr - Za: 11:00 - 23:00<br />
                  Zo: 12:00 - 21:00
                </p>
              </div>
            </div>

            <a
              href="https://maps.google.com/?q=Markthal+Rotterdam"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sumo-gold hover:text-sumo-cream transition-colors"
            >
              <span className="text-sm tracking-widest uppercase">Get Directions</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}