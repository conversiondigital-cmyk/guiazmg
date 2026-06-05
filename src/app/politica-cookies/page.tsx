export const metadata = {
  title: "Política de Cookies | Guía ZMG",
  description: "Información sobre el uso de cookies en Guía ZMG.",
}

export default function CookiesPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 prose prose-slate max-w-none">
      <h1>Política de Cookies</h1>
      <p>Usamos cookies y tecnologías similares para sesión, seguridad, preferencias y analítica.</p>
      <h2>Tipos de cookies</h2>
      <ul>
        <li>Esenciales: sesión y seguridad</li>
        <li>Preferencias: idioma y configuración</li>
        <li>Analítica: uso de la plataforma</li>
      </ul>
      <h2>Control</h2>
      <p>El usuario puede gestionar cookies desde su navegador.</p>
    </div>
  )
}
