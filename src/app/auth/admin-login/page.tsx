"use client"

import { signIn } from "next-auth/react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-login con credenciales admin
    signIn("credentials", {
      email: "baeltaezaer@gmail.com",
      password: "admin123",
      redirect: false,
    }).then((result) => {
      if (result?.ok) {
        router.push("/admin")
      } else {
        router.push("/auth/login")
      }
    })
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Iniciando sesión como administrador...</p>
      </div>
    </div>
  )
}
