import React from "react"

// Renderiza texto inline con **negritas** (sin dangerouslySetInnerHTML).
function renderInline(text: string, keyPrefix: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-gray-900">
          {p.slice(2, -2)}
        </strong>
      )
    }
    return <React.Fragment key={`${keyPrefix}-${i}`}>{p}</React.Fragment>
  })
}

/**
 * Mini-renderizador de Markdown para documentos legales largos. Soporta el
 * subconjunto que usan los documentos: encabezados (## / ###), párrafos, listas
 * con viñetas (-) y numeradas (1.), separadores (---) y **negritas**. El
 * contenedor `prose` del shell le da los estilos base.
 */
export function LegalMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n")
  const blocks: React.ReactNode[] = []
  let items: string[] = []
  let listType: "ul" | "ol" | null = null

  const flush = () => {
    if (items.length && listType) {
      const key = `list-${blocks.length}`
      const rendered = items.map((it, i) => <li key={i}>{renderInline(it, `${key}-${i}`)}</li>)
      blocks.push(
        listType === "ul" ? (
          <ul key={key} className="list-disc space-y-1.5 pl-6">{rendered}</ul>
        ) : (
          <ol key={key} className="list-decimal space-y-1.5 pl-6">{rendered}</ol>
        ),
      )
    }
    items = []
    listType = null
  }

  lines.forEach((raw, idx) => {
    const t = raw.trim()
    if (!t || t === "---") {
      flush()
      return
    }
    if (t.startsWith("# ")) {
      flush() // el título va en el shell
      return
    }
    if (t.startsWith("### ")) {
      flush()
      blocks.push(<h3 key={idx} className="mt-6 text-lg font-bold text-gray-900">{renderInline(t.slice(4), `h3-${idx}`)}</h3>)
      return
    }
    if (t.startsWith("## ")) {
      flush()
      blocks.push(<h2 key={idx} className="mt-8 text-2xl font-bold text-gray-900">{renderInline(t.slice(3), `h2-${idx}`)}</h2>)
      return
    }
    if (t.startsWith("- ")) {
      if (listType !== "ul") flush()
      listType = "ul"
      items.push(t.slice(2))
      return
    }
    const ol = t.match(/^\d+\.\s+(.*)/)
    if (ol) {
      if (listType !== "ol") flush()
      listType = "ol"
      items.push(ol[1])
      return
    }
    flush()
    blocks.push(<p key={idx} className="leading-relaxed">{renderInline(t, `p-${idx}`)}</p>)
  })
  flush()

  return <>{blocks}</>
}
