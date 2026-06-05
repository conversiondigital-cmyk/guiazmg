"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Phone, MessageCircle, Globe, MapPin, ExternalLink, Music2 } from "@/lib/icons"
import { formatPhone, getWhatsAppLink, getMapsLink } from "@/lib/utils"
import type { Business } from "@/types"

interface BusinessActionsProps {
  business: Business
}

export function BusinessActions({ business }: BusinessActionsProps) {
  const btnClass = "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors w-full"
  const greenBtnClass = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors w-full"

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        {business.phone && (
          <a href={`tel:${business.phone}`} className={`${greenBtnClass} bg-green-600 hover:bg-green-700`}>
            <Phone className="h-4 w-4" />
            {formatPhone(business.phone)}
          </a>
        )}

        {business.whatsapp && (
          <a
            href={getWhatsAppLink(business.whatsapp, `Hola, vi tu negocio en Guía ZMG`)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${greenBtnClass} bg-green-500 hover:bg-green-600`}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        )}

        {business.websiteUrl && (
          <a href={business.websiteUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
            <Globe className="h-4 w-4" />
            Visitar sitio web
          </a>
        )}

        {business.latitude && business.longitude && (
          <a href={getMapsLink(business.latitude, business.longitude)} target="_blank" rel="noopener noreferrer" className={btnClass}>
            <MapPin className="h-4 w-4" />
            Cómo llegar
          </a>
        )}

        <div className="pt-3 border-t">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Redes sociales</h3>
          <div className="flex flex-wrap gap-2">
            {business.facebookUrl && (
              <a href={business.facebookUrl} target="_blank" rel="noopener noreferrer" title="Facebook" className={btnClass.replace("w-full", "w-auto px-3")}>
                <ExternalLink className="h-4 w-4 text-blue-600" />
              </a>
            )}
            {business.instagramUrl && (
              <a href={business.instagramUrl} target="_blank" rel="noopener noreferrer" title="Instagram" className={btnClass.replace("w-full", "w-auto px-3")}>
                <ExternalLink className="h-4 w-4 text-pink-600" />
              </a>
            )}
            {business.tiktokUrl && (
              <a href={business.tiktokUrl} target="_blank" rel="noopener noreferrer" title="TikTok" className={btnClass.replace("w-full", "w-auto px-3")}>
                <Music2 className="h-4 w-4 text-gray-900" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
