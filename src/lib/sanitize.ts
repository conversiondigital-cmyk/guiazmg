import sanitizeHtml from "sanitize-html"

// Sanea el HTML del contenido del blog antes de renderizarlo con
// dangerouslySetInnerHTML. Hoy ese contenido lo escribe solo un admin (input
// confiable), así que esto es DEFENSA EN PROFUNDIDAD: si una cuenta admin se
// compromete —o si en el futuro alguien más puede publicar— el HTML resultante
// no podrá ejecutar <script>, manejadores on*, ni URLs javascript:.
//
// La lista blanca calza EXACTAMENTE con lo que produce el editor TipTap del
// panel (StarterKit + Underline + TextAlign + TextStyle + Image + Link):
// encabezados, listas, cita, código, negrita/cursiva/subrayado/tachado,
// enlaces, imágenes (subidas a R2, nunca base64) y alineación por estilo.
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "strong", "b", "em", "i", "u", "s", "strike",
    "a", "img", "span",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "class"],
    img: ["src", "alt", "title", "width", "height", "class"],
    "*": ["class", "style"],
  },
  // Solo alineación y color; nunca position/expression/url() que habilitan CSS
  // malicioso o exfiltración.
  allowedStyles: {
    "*": {
      "text-align": [/^(left|right|center|justify)$/],
      color: [/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/],
    },
  },
  // sanitize-html ya elimina javascript:/data: por defecto; lo hacemos explícito.
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  transformTags: {
    // Todo enlace que abra en pestaña nueva sale con rel seguro (evita
    // tabnabbing y fuga de referrer).
    a: (tagName, attribs) => {
      const attrs = { ...attribs }
      if (attrs.target === "_blank") {
        attrs.rel = "noopener noreferrer nofollow"
      }
      return { tagName, attribs: attrs }
    },
  },
}

export function sanitizePostHtml(html: string | null | undefined): string {
  if (!html) return ""
  return sanitizeHtml(html, OPTIONS)
}
