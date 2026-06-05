"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@/lib/animations"
import { MapPin, Phone, MessageCircle } from "@/lib/icons"
import { truncate } from "@/lib/utils"
import type { Business } from "@/types"

interface FeaturedBusinessesProps {
  businesses: Business[]
}

export function FeaturedBusinesses({ businesses }: FeaturedBusinessesProps) {
  if (!businesses.length) return null

  return (
    <section className="py-16 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <motion.h2 variants={staggerItem} className="text-3xl font-bold text-gray-900">
              Perfiles destacados
            </motion.h2>
            <motion.p variants={staggerItem} className="mt-2 text-gray-600">
              Los mejores perfiles de la ZMG
            </motion.p>
          </div>
          <motion.div variants={staggerItem}>
            <Link
              href="/search"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Ver todos &rarr;
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {businesses.map((business) => (
            <motion.div key={business.id} variants={staggerItem}>
              <Link href={`/perfil/${business.slug}`}>
                <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:border-blue-200 cursor-pointer">
                  <div className="aspect-[16/9] bg-gradient-to-br from-blue-100 to-blue-50 relative">
                    {business.coverImageUrl && (
                      <Image src={business.coverImageUrl} alt={business.name} fill className="object-cover" />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {business.isVerified && (
                        <Badge className="bg-blue-600 text-white text-xs">Verificado</Badge>
                      )}
                      {business.memberships?.some((m) => m.status === "ACTIVE") && (
                        <Badge className="bg-amber-500 text-white text-xs">Premium</Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {business.name}
                    </h3>
                    {business.shortDescription && (
                      <p className="mt-1 text-sm text-gray-500">
                        {truncate(business.shortDescription, 80)}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      {business.municipality && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {business.municipality.name}
                        </span>
                      )}
                      {business.category && (
                        <Badge variant="secondary" className="text-xs">
                          {business.category.name}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      {business.phone && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                          <Phone className="h-3 w-3" /> Llamar
                        </span>
                      )}
                      {business.whatsapp && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <MessageCircle className="h-3 w-3" /> WhatsApp
                        </span>
                      )}
                    </div>
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
