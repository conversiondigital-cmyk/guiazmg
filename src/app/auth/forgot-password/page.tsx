import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default async function ForgotPasswordPage() {
  // Si ya hay sesión, no tiene sentido "recuperar contraseña": va a su panel.
  const session = await auth()
  if (session?.user) redirect("/dashboard")
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Recuperar contraseña</h1>
            <p className="mt-2 text-gray-500">
              Te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>
          <ForgotPasswordForm />
          <p className="mt-6 text-center text-sm text-gray-500">
            <Link href="/auth/login" className="text-green-700 hover:text-green-800 font-medium">
              Volver a inicio de sesión
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
