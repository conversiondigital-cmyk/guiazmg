import { redirect } from "next/navigation"

// El aviso completo con estructura del sitio vive en /aviso-privacidad.
export default function AvisoLegalPage() {
  redirect("/aviso-privacidad")
}
