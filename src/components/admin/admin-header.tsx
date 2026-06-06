"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Bell,
  Menu,
  Search,
  ChevronDown,
  LogOut,
  Settings,
  HelpCircle,
  Shield,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/admin-constants"

interface AdminHeaderProps {
  title?: string
  onMenuClick?: () => void
}

export function AdminHeader({ title, onMenuClick }: AdminHeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // TODO: Implement global search across admin entities
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchOpen(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" })
  }

  const roleColor = session?.user.role ? ROLE_COLORS[session.user.role as keyof typeof ROLE_COLORS] : null
  const roleLabel = session?.user.role ? ROLE_LABELS[session.user.role as keyof typeof ROLE_LABELS] : ""

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black bg-slate-950 text-white shadow-2xl">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Section: Logo + Breadcrumb */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Menu Toggle (Mobile) */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700">
              <MapPin className="h-4 w-4 fill-current text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-bold">Guía ZMG</span>
              <div className="text-[10px] text-gray-400">Panel Admin</div>
            </div>
          </Link>

          {/* Title/Breadcrumb */}
          {title && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-300 ml-4 pl-4 border-l border-gray-700">
              <span>{title}</span>
            </div>
          )}
        </div>

        {/* Middle Section: Search */}
        <div className="hidden sm:flex items-center flex-1 max-w-xs mx-4">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="w-full">
              <Input
                type="text"
                placeholder="Buscar usuarios, negocios, pagos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => setSearchOpen(false)}
                autoFocus
                className="bg-slate-800 border-gray-600 text-white placeholder:text-gray-500 h-9"
              />
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-gray-400 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Buscar...</span>
            </button>
          )}
        </div>

        {/* Right Section: Actions + User Menu */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* System Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-xs text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Sistema OK</span>
          </div>

          {/* User Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors">
                <div className="hidden sm:flex flex-col items-end">
                  <div className="text-sm font-medium text-white">
                    {session?.user.name || session?.user.email}
                  </div>
                  <Badge
                    className={`mt-1 h-5 px-2 text-[10px] font-bold ${roleColor?.bg || ""} ${roleColor?.text || ""}`}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {roleLabel}
                  </Badge>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-900">
                  {session?.user.name || "Administrador"}
                </div>
                <div className="text-xs text-gray-500 mt-1">{session?.user.email}</div>
                <Badge className={`mt-2 ${roleColor?.bg || ""} ${roleColor?.text || ""}`}>
                  {roleLabel}
                </Badge>
              </div>

              {/* Menu Items */}
              <DropdownMenuItem onClick={() => window.location.href = "/admin/configuracion"}>
                <Settings className="w-4 h-4 mr-2" />
                <span>Configuración</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => window.location.href = "/admin/auditoria"}>
                <Shield className="w-4 h-4 mr-2" />
                <span>Auditoría</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => window.open("https://docs.guia-zmg.local", "_blank")}>
                <HelpCircle className="w-4 h-4 mr-2" />
                <span>Documentación</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* View Dashboard */}
              <DropdownMenuItem onClick={() => window.location.href = "/dashboard"}>
                <span>Ir al Dashboard</span>
              </DropdownMenuItem>

              {/* Logout */}
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer flex items-center gap-3 text-red-600 hover:bg-red-50 px-4 py-2 rounded"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
