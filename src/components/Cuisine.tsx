'use client'

import { motion } from 'framer-motion'

const sections = [
  {
    label: 'Japanese Cuisine',
    title: 'Sushi & Sashimi',
    description: 'Onze sushi chef creëert dagelijks verse sushi met de beste ingrediënten. Van klassieke nigiri tot signature rolls - elke creatie is een kunstwerk.',
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=1000&fit=crop',
    link: '#menu'
  },
  {
    label: 'Robata Grill',
    title: 'Traditional Grilling',
    description: 'Onze robata grill gebruikt traditionele Japanse technieken waarbij ingrediënten langzaam worden gegaard. Het resultaat: intense smaken en een unieke rooksensatie.',
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=1000&fit=crop',
    link: '#menu'
  }
]

export default function Cuisine() {
  return (
    <section id="menu" className="bg-sumo-dark">
      {sections.map((section, index) => (
        <div
          key={section.title}
          className={`grid grid-cols-1 lg:grid-cols-2 min-h-screen ${
            index % 2 === 1 ? 'lg:flex-row-reverse' : ''
          }`}
        >
          {/* Image */}
          <motion.div
            className={`relative h-[50vh] lg:h-auto ${index % 2 === 1 ? 'lg:order-2' : ''}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${section.image}')` }}
            />
            <div className="absolute inset-0 bg-sumo-black/20" />
          </motion.div>

          {/* Content */}
          <motion.div
            className={`flex items-center py-20 lg:py-0 px-8 lg:px-16 ${index % 2 === 1 ? 'lg:order-1' : ''}`}
            initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="max-w-lg">
              {/* Label */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-px bg-sumo-gold" />
                <span className="text-sumo-gold text-sm tracking-widest uppercase">
                  {section.label}
                </span>
              </div>

              {/* Title */}
              <h2 className="font-display text-4xl lg:text-5xl font-light text-sumo-cream mb-8">
                {section.title}
              </h2>

              {/* Description */}
              <p className="text-sumo-cream/70 text-lg leading-relaxed mb-10">
                {section.description}
              </p>

              {/* Link */}
              <a
                href={section.link}
                className="inline-block border border-sumo-gold/50 text-sumo-gold px-6 py-2 text-sm tracking-widest uppercase hover:bg-sumo-gold hover:text-sumo-black transition-all duration-300"
              >
                Menu
              </a>
            </div>
          </motion.div>
        </div>
      ))}

      {/* Asian Fusion Section */}
      <div className="py-32 px-8 text-center bg-sumo-black">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-10 h-px bg-sumo-gold" />
            <span className="text-sumo-gold text-sm tracking-widest uppercase">
              Asian Fusion
            </span>
            <div className="w-10 h-px bg-sumo-gold" />
          </div>

          <h2 className="font-display text-4xl lg:text-5xl font-light text-sumo-cream mb-8">
            Asian Fusion Cuisine
          </h2>

          <p className="text-sumo-cream/70 text-lg leading-relaxed mb-10">
            Hoewel de Japanse keuken onze basis vormt, kijken we graag verder. 
            We maken culinaire uitstapjes naar andere Aziatische keukens en 
            combineren smaken en technieken tot verrassende fusioncreaties.
          </p>

          <a
            href="#contact"
            className="inline-block border border-sumo-gold/50 text-sumo-gold px-8 py-3 text-sm tracking-widest uppercase hover:bg-sumo-gold hover:text-sumo-black transition-all duration-300"
          >
            Reserveren
          </a>
        </motion.div>
      </div>
    </section>
  )
}