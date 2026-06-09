import { ReactNode } from "react"

interface PageHeroProps {
  eyebrow?: string
  title: string
  subtitle?: string
  date?: string
  icon?: ReactNode
  actions?: ReactNode
  size?: "sm" | "md" | "lg"
}

/**
 * Consistent hero section used across all content/legal pages.
 * Uses the site's brand green theme.
 */
export function PageHero({ eyebrow, title, subtitle, date, icon, actions, size = "md" }: PageHeroProps) {
  const py = size === "sm" ? "py-12" : size === "lg" ? "py-24" : "py-16"

  return (
    <section className={`bg-green-900 ${py} relative overflow-hidden`}>
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {icon && (
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            {icon}
          </div>
        )}
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-black text-white sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-lg text-green-200 leading-relaxed">
            {subtitle}
          </p>
        )}
        {date && (
          <p className="mt-2 text-sm text-green-300">
            {date}
          </p>
        )}
        {actions && (
          <div className="mt-6 flex flex-wrap gap-3">
            {actions}
          </div>
        )}
      </div>
    </section>
  )
}
