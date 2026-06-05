"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle } from "@/lib/icons"

interface WhatsAppShareProps {
  text: string
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
  className?: string
}

export function WhatsAppShare({ text, variant = "outline", size = "sm", className }: WhatsAppShareProps) {
  const handleShare = () => {
    const encoded = encodeURIComponent(text)
    window.open(`https://wa.me/?text=${encoded}`, "_blank")
  }

  return (
    <Button variant={variant} size={size} onClick={handleShare} className={className}>
      <MessageCircle className="h-4 w-4 mr-1.5" />
      Compartir
    </Button>
  )
}
