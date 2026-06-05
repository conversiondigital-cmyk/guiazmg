export const metadata = {
  title: "Política de Privacidad | Guía ZMG",
  description: "Política de privacidad y tratamiento de datos personales de Guía ZMG.",
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 prose prose-slate max-w-none">
      <h1>Política de Privacidad</h1>
      <p>Tratamos datos personales conforme a la legislación mexicana aplicable.</p>
      <h2>Datos recopilados</h2>
      <ul>
        <li>Nombre</li>
        <li>Correo electrónico</li>
        <li>Teléfono</li>
        <li>Ubicación aproximada</li>
        <li>Actividad dentro de la plataforma</li>
      </ul>
      <h2>Derechos ARCO</h2>
      <p>El usuario puede acceder, rectificar, cancelar u oponerse al tratamiento de sus datos, así como solicitar exportación o eliminación.</p>
      <h2>Seguridad</h2>
      <p>Usamos HTTPS, contraseñas cifradas y controles de acceso para proteger la información.</p>
    </div>
  )
}
