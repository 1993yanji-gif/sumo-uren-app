'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = ['Home', 'Menu', 'About', 'Location', 'Contact']

  return (
    <>
      {/* Main Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <motion.a 
              href="#"
              className="z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <span className="font-display text-2xl text-sumo-cream tracking-wider">SUMO</span>
            </motion.a>

            {/* Menu Button */}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="z-50 flex items-center gap-3 text-sumo-cream"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-sm tracking-widest uppercase hidden sm:block">
                {isOpen ? 'Close' : 'Menu'}
              </span>
              <div className="relative w-6 h-4 flex flex-col justify-between">
                <span 
                  className={`w-full h-px bg-sumo-cream transition-all duration-300 ${
                    isOpen ? 'rotate-45 translate-y-1.5' : ''
                  }`} 
                />
                <span 
                  className={`w-full h-px bg-sumo-cream transition-all duration-300 ${
                    isOpen ? '-rotate-45 -translate-y-1.5' : ''
                  }`} 
                />
              </div>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Full Screen Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-40 bg-sumo-black"
          >
            <div className="h-full grid grid-cols-1 lg:grid-cols-2">
              {/* Left Side - Menu Items */}
              <div className="flex items-center justify-center px-8 lg:px-16">
                <nav className="space-y-6">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                    >
                      <a
                        href={item === 'Home' ? '#' : `#${item.toLowerCase()}`}
                        onClick={() => setIsOpen(false)}
                        className="block font-display text-4xl sm:text-5xl lg:text-6xl text-sumo-cream hover:text-sumo-gold transition-colors duration-300"
                      >
                        {item}
                      </a>
                    </motion.div>
                  ))}
                </nav>
              </div>

              {/* Right Side - Video/Image */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="hidden lg:block relative"
              >
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source 
                    src="https://cdn.coverr.co/videos/coverr-preparing-sushi-roll-5703/1080p.mp4" 
                    type="video/mp4" 
                  />
                </video>
                <div className="absolute inset-0 bg-sumo-black/30" />
              </motion.div>
            </div>

            {/* Bottom Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="absolute bottom-8 left-8 lg:left-16"
            >
              <div className="flex items-center gap-6 text-sumo-cream/50 text-sm">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-sumo-gold transition-colors">
                  Instagram
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-sumo-gold transition-colors">
                  Facebook
                </a>
                <span className="text-sumo-cream/30">#sumomarkthal</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}