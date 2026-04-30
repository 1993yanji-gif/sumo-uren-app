'use client'

import { motion } from 'framer-motion'

export default function Contact() {
  return (
    <section id="contact" className="relative py-32 bg-sumo-black">
      {/* Top border */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-sumo-gold/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-10 h-px bg-sumo-gold" />
            <span className="text-sumo-gold text-sm tracking-widest uppercase">Contact</span>
            <div className="w-10 h-px bg-sumo-gold" />
          </div>

          <h2 className="font-display text-4xl lg:text-5xl xl:text-6xl font-light text-sumo-cream">
            Reserveren
          </h2>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h4 className="text-sumo-gold text-sm tracking-widest uppercase mb-3">Telefoon</h4>
              <a href="tel:+31101234567" className="text-sumo-cream/70 hover:text-sumo-cream transition-colors text-lg">
                +31 10 123 4567
              </a>
            </div>

            <div>
              <h4 className="text-sumo-gold text-sm tracking-widest uppercase mb-3">Email</h4>
              <a href="mailto:info@sushimarkthal.nl" className="text-sumo-cream/70 hover:text-sumo-cream transition-colors text-lg">
                info@sushimarkthal.nl
              </a>
            </div>

            <div>
              <h4 className="text-sumo-gold text-sm tracking-widest uppercase mb-3">Adres</h4>
              <p className="text-sumo-cream/70 text-lg">
                Dominee Jan Scharpstraat 298<br />
                3011 GZ Rotterdam<br />
                Markthal Rotterdam
              </p>
            </div>
          </motion.div>

          {/* Reservation Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sumo-gold text-sm tracking-widest uppercase mb-2">
                    Naam
                  </label>
                  <input
                    type="text"
                    className="w-full bg-transparent border-b border-sumo-cream/20 py-3 text-sumo-cream placeholder-sumo-cream/30 focus:border-sumo-gold focus:outline-none transition-colors"
                    placeholder="Uw naam"
                  />
                </div>
                <div>
                  <label className="block text-sumo-gold text-sm tracking-widest uppercase mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full bg-transparent border-b border-sumo-cream/20 py-3 text-sumo-cream placeholder-sumo-cream/30 focus:border-sumo-gold focus:outline-none transition-colors"
                    placeholder="uw@email.nl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sumo-gold text-sm tracking-widest uppercase mb-2">
                    Datum
                  </label>
                  <input
                    type="date"
                    className="w-full bg-transparent border-b border-sumo-cream/20 py-3 text-sumo-cream focus:border-sumo-gold focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sumo-gold text-sm tracking-widest uppercase mb-2">
                    Tijd
                  </label>
                  <input
                    type="time"
                    className="w-full bg-transparent border-b border-sumo-cream/20 py-3 text-sumo-cream focus:border-sumo-gold focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sumo-gold text-sm tracking-widest uppercase mb-2">
                    Gasten
                  </label>
                  <select className="w-full bg-transparent border-b border-sumo-cream/20 py-3 text-sumo-cream focus:border-sumo-gold focus:outline-none transition-colors">
                    <option value="2" className="bg-sumo-black">2 personen</option>
                    <option value="3" className="bg-sumo-black">3 personen</option>
                    <option value="4" className="bg-sumo-black">4 personen</option>
                    <option value="5" className="bg-sumo-black">5+ personen</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sumo-gold text-sm tracking-widest uppercase mb-2">
                  Bericht
                </label>
                <textarea
                  rows={4}
                  className="w-full bg-transparent border-b border-sumo-cream/20 py-3 text-sumo-cream placeholder-sumo-cream/30 focus:border-sumo-gold focus:outline-none transition-colors resize-none"
                  placeholder="Speciale wensen of dieetwensen..."
                />
              </div>

              <button
                type="submit"
                className="mt-8 border border-sumo-gold text-sumo-gold px-12 py-4 text-sm tracking-widest uppercase hover:bg-sumo-gold hover:text-sumo-black transition-all duration-300"
              >
                Reserveer Nu
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.footer
        className="mt-32 pt-8 border-t border-sumo-cream/10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-8">
              <span className="font-display text-2xl text-sumo-cream">SUMO</span>
              <span className="text-sumo-cream/30 text-sm">Markthal Rotterdam</span>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-sumo-cream/50 hover:text-sumo-gold transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-sumo-cream/50 hover:text-sumo-gold transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>

            <p className="text-sumo-cream/30 text-sm">
              © 2026 SUMO Markthal Rotterdam
            </p>
          </div>
        </div>
      </motion.footer>
    </section>
  )
}