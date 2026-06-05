export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-16 items-center justify-between border-b bg-white px-6">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-6">
              <div className="mb-3 h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-xl border bg-white p-6">
          <div className="mb-4 h-6 w-36 animate-pulse rounded bg-gray-200" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
