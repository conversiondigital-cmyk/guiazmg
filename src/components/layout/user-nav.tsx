"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

interface UserNavProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  }
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter()

  const isAdmin = user.role === "ADMIN"
  const isEditor = user.role === "EDITOR"
  const isAgent = user.role === "SALES_AGENT"

  const panelHref = isAdmin ? "/admin" : isEditor ? "/editor" : isAgent ? "/agente" : "/dashboard"
  const panelLabel = isAdmin ? "Panel Admin" : isEditor ? "Panel Editor" : isAgent ? "Panel Agente" : "Mi Dashboard"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none cursor-pointer">
        <Avatar className="h-8 w-8">
          <AvatarFallback className={`text-xs text-white ${isAdmin ? "bg-red-700" : "bg-blue-600"}`}>
            {user.name ? getInitials(user.name) : "U"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <span>{user.name || "Usuario"}</span>
              <span className="text-xs text-gray-500">{user.email}</span>
              {(isAdmin || isEditor || isAgent) && (
                <span className="mt-1 inline-flex w-fit rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  {user.role}
                </span>
              )}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Enlace principal al panel correcto según el rol */}
        <Link
          href={panelHref}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {panelLabel}
        </Link>

        {/* Solo mostrar links de negocio a usuarios normales */}
        {!isAdmin && !isEditor && !isAgent && (
          <>
            <Link href="/dashboard/negocio" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
              Mi Perfil
            </Link>
            <Link href="/dashboard/favorites" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
              Favoritos
            </Link>
          </>
        )}

        <DropdownMenuSeparator />

        <button
          onClick={async () => {
            await fetch("/api/auth/signout", { method: "POST" })
            router.push("/")
            router.refresh()
          }}
          className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
        >
          Cerrar Sesión
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
