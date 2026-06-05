import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { TrendingUp } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminBusquedasPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  const [totalSearches, topTerms, recentSearches, emptySearches] = await Promise.all([
    prisma.searchLog.count(),
    prisma.searchLog.groupBy({
      by: ["query"],
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 20,
    }),
    prisma.searchLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { query: true, municipality: true, resultsCount: true, createdAt: true },
    }),
    prisma.searchLog.count({ where: { resultsCount: 0 } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Búsquedas populares</h1>
        <p className="text-sm text-muted-foreground">
          Análisis de los términos más buscados en Guía ZMG
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total búsquedas</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalSearches.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sin resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{emptySearches.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Términos únicos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{topTerms.length}+</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Top 20 términos buscados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topTerms.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin datos aún</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Término</TableHead>
                    <TableHead className="text-right">Búsquedas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topTerms.map((t, i) => (
                    <TableRow key={t.query}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{t.query}</TableCell>
                      <TableCell className="text-right font-mono">{t._count.query}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Búsquedas recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSearches.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin datos aún</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Término</TableHead>
                    <TableHead>Municipio</TableHead>
                    <TableHead className="text-right">Resultados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSearches.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{s.query}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{s.municipality ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <span className={s.resultsCount === 0 ? "text-red-500 font-medium" : ""}>
                          {s.resultsCount}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
