"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@/lib/animations"
import type { Category, Subcategory } from "@/types"

interface CategoryWithCount extends Category {
  subcategories: Subcategory[]
  _count?: { businesses: number }
}

interface CategoryGridProps {
  categories: CategoryWithCount[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (!categories.length) return null

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="text-center mb-10"
        >
          <motion.h2
            variants={staggerItem}
            className="text-3xl font-bold text-gray-900"
          >
            Explora por categoría
          </motion.h2>
          <motion.p variants={staggerItem} className="mt-2 text-gray-600">
            Encuentra exactamente lo que buscas
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        >
          {categories.map((category) => (
            <motion.div key={category.id} variants={staggerItem}>
              <Link href={`/categoria/${category.slug}`}>
                <Card className="group h-full transition-all hover:shadow-md hover:border-blue-200 cursor-pointer">
                  <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                    {category.icon && (
                      <span className="text-2xl mb-2">{category.icon}</span>
                    )}
                    <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </span>
                    {category._count && (
                      <span className="mt-1 text-xs text-gray-400">
                        {category._count.businesses} negocio{category._count.businesses !== 1 ? "s" : ""}
                      </span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
