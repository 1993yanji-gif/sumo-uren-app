'use client'

import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          poster="https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=2070&q=80"
        >
          <source 
            src="https://cdn.coverr.co/videos/coverr-preparing-sushi-roll-5703/1080p.mp4" 
            type="video/mp4" 
          />
        </video>
        {/* Overlay */}
        <div className="absolute inset-0 video-overlay" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light text-sumo-cream mb-6 tracking-wide">
            Modern Japanese Cuisine
          </h1>
        </motion.div>

        <motion.p
          className="text-sumo-cream/70 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          Bij SUMO geniet je van verfijnde Japanse gerechten met een moderne twist. 
          In een stijlvolle setting creëren we een unieke beleving waarin smaak, 
          sfeer en gastvrijheid samenkomen.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
        >
          <a
            href="#about"
            className="inline-block border border-sumo-gold text-sumo-gold px-8 py-3 text-sm tracking-widest uppercase hover:bg-sumo-gold hover:text-sumo-black transition-all duration-300"
          >
            Ontdek meer
          </a>
        </motion.div>
      </div>

      {/* Bottom Elements */}
      <div className="absolute bottom-8 left-0 right-0 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-end text-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-px bg-sumo-gold/50" />
            <span className="text-sumo-cream/50 tracking-wider">Rotterdam</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-sumo-cream/50 text-xs tracking-widest">Scroll To Explore</span>
            <div className="w-px h-8 bg-sumo-gold/50 animate-pulse" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="text-sumo-cream/50 tracking-wider"
          >
            #sumomarkthal
          </motion.div>
        </div>
      </div>
    </section>
  )
}