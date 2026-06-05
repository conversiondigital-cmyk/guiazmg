"use client"

import { BusinessForm } from "@/components/business/business-form"

export default function NewBusinessPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Registrar Negocio</h1>
        <p className="text-gray-500">Completa la información de tu negocio para aparecer en Guía ZMG</p>
      </div>
      <BusinessForm />
    </div>
  )
}
