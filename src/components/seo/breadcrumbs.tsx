import Link from "next/link"
import { breadcrumbSchema, safeJsonLd } from "@/lib/seo/schema"
import { ChevronRight, Home } from "@/lib/icons"

interface BreadcrumbItem {
  name: string
  href?: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const schemaItems = items
    .filter((item) => item.href)
    .map((item) => ({
      name: item.name,
      url: item.href!,
    }))

  const jsonLd = breadcrumbSchema(schemaItems)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <nav aria-label="breadcrumb" className="flex items-center text-sm text-muted-foreground">
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          <span className="sr-only">Inicio</span>
        </Link>
        {items.map((item, i) => (
          <span key={i} className="flex items-center">
            <ChevronRight className="mx-1.5 h-3.5 w-3.5" />
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ) : (
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {item.name}
              </span>
            )}
          </span>
        ))}
      </nav>
    </>
  )
}
