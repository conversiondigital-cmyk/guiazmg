export const metadata = {
  title: "Aviso Legal | Guía ZMG",
  description: "Aviso legal y descargo de responsabilidad de Guía ZMG.",
}

export default function LegalNoticePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 prose prose-slate max-w-none">
      <h1>Aviso Legal</h1>
      <p>Guía ZMG es una plataforma tecnológica de conexión entre usuarios y negocios.</p>
      <p>No vendemos productos, no prestamos servicios y no somos intermediarios financieros.</p>
      <h2>Descargo de responsabilidad</h2>
      <p>No garantizamos la calidad de productos o servicios de terceros ni la veracidad absoluta de sus publicaciones.</p>
      <h2>Jurisdicción</h2>
      <p>Este sitio opera bajo la jurisdicción aplicable en Jalisco, México.</p>
    </div>
  )
}
