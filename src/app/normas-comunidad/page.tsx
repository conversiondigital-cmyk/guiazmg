export const metadata = {
  title: "Normas de Comunidad | Guía ZMG",
  description: "Normas de comunidad para publicar en Guía ZMG.",
}

export default function CommunityRulesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 prose prose-slate max-w-none">
      <h1>Normas de Comunidad</h1>
      <p>Estas reglas aplican a reseñas, anuncios, marketplace, solicitudes y cualquier contenido generado por usuarios.</p>
      <h2>Contenido prohibido</h2>
      <ul>
        <li>Spam, fraude o suplantación</li>
        <li>Contenido ilegal o robado</li>
        <li>Violencia, amenazas o discriminación</li>
        <li>Malware o intentos de hackeo</li>
      </ul>
      <h2>Reseñas</h2>
      <p>Las reseñas deben reflejar experiencias reales.</p>
      <h2>Moderación</h2>
      <p>Podemos ocultar o eliminar contenido y suspender usuarios cuando exista incumplimiento.</p>
    </div>
  )
}
