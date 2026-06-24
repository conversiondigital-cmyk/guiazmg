// UI compartida por las secciones del panel de agente.

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  )
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card p-12 text-center">
      <h3 className="font-heading text-base font-medium">{title}</h3>
      {subtitle ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  )
}

export function NoAgentNotice() {
  return (
    <EmptyState
      title="Sin perfil de agente"
      subtitle="Tu cuenta no tiene un perfil de agente de ventas asociado. Pide a un administrador que te dé de alta como agente."
    />
  )
}
