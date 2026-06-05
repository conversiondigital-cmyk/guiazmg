"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, Link as LinkIcon } from "@/lib/icons"
import { toast } from "sonner"

interface Props {
  code: string
  shareUrl: string
}

export function ReferralCodeDisplay({ code, shareUrl }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success("¡Enlace copiado al portapapeles!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar el enlace")
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Guía ZMG - Registro",
          text: "Regístrate en Guía ZMG con mi código de referido y obtén beneficios.",
          url: shareUrl,
        })
      } catch {
        // user cancelled
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">Tu código</p>
          <p className="text-2xl font-mono font-bold text-blue-600 tracking-wider">
            {code}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? (
            <>
              <CheckCircle className="mr-1.5 h-4 w-4 text-green-500" />
              Copiado
            </>
          ) : (
            <>
              <LinkIcon className="mr-1.5 h-4 w-4" />
              Copiar
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={shareUrl}
          className="flex-1 p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-600 font-mono"
          onClick={(e) => e.currentTarget.select()}
        />
        <Button onClick={handleShare}>
          <LinkIcon className="mr-1.5 h-4 w-4" />
          Compartir
        </Button>
      </div>
    </div>
  )
}
