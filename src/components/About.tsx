'use client'

import { motion } from 'framer-motion'

export default function About() {
  return (
    <section id="about" className="relative py-32 bg-sumo-black overflow-hidden">
      {/* Decorative Japanese illustration - Fish */}
      <div className="absolute top-20 right-0 w-96 h-96 opacity-5">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M150 100c0 27.614-22.386 50-50 50s-50-22.386-50-50 22.386-50 50-50 50 22.386 50 50z" stroke="#c9a227" strokeWidth="0.5"/>
          <path d="M100 30c-38.66 0-70 31.34-70 70s31.34 70 70 70 70-31.34 70-70-31.34-70-70-70z" stroke="#c9a227" strokeWidth="0.3"/>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {/* Label */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-px bg-sumo-gold" />
              <span className="text-sumo-gold text-sm tracking-widest uppercase">About SUMO</span>
            </div>

            {/* Title */}
            <h2 className="font-display text-4xl lg:text-5xl xl:text-6xl font-light text-sumo-cream mb-8 leading-tight">
              unique dining<br />experience
            </h2>

            <a
              href="#menu"
              className="inline-block border border-sumo-gold/50 text-sumo-gold px-6 py-2 text-sm tracking-widest uppercase hover:bg-sumo-gold hover:text-sumo-black transition-all duration-300"
            >
              Menu
            </a>
          </motion.div>

          {/* Right Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="lg:pl-12"
          >
            <p className="text-sumo-cream/70 text-lg leading-relaxed mb-8">
              SUMO biedt meer dan alleen een diner, het is een zintuiglijke reis 
              door de moderne Japanse keuken in combinatie met invloeden vanuit 
              de fusion Aziatische keuken.
            </p>
            
            <p className="text-sumo-cream/70 text-lg leading-relaxed mb-12">
              Geniet van zorgvuldig bereide gerechten in een eigentijdse sfeer 
              waar ieder detail klopt. Of je nu langskomt voor een intiem diner 
              of een bijzondere avond uit: elke ervaring bij SUMO is er één om 
              te onthouden.
            </p>

            {/* Decorative Letters */}
            <div className="flex items-center gap-4">
              <span className="font-display text-8xl text-sumo-gold/20">S</span>
              <div className="w-8 h-8 rounded-full border border-sumo-gold/30" />
              <span className="font-display text-8xl text-sumo-gold/20">U</span>
            </div>
          </motion.div>
        </div>

        {/* Image Gallery */}
        <motion.div
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {[
            'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=500&fit=crop',
            'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=500&fit=crop',
            'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400&h=500&fit=crop',
            'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400&h=500&fit=crop',
          ].map((src, index) => (
            <div
              key={index}
              className="aspect-[4/5] overflow-hidden group"
            >
              <div
                className="w-full h-full bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700"
                style={{ backgroundImage: `url('${src}')` }}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}