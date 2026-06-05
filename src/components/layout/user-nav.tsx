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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none cursor-pointer">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-blue-600 text-white">
            {user.name ? getInitials(user.name) : "U"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{user.name || "Usuario"}</span>
            <span className="text-xs text-gray-500">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <Link href="/dashboard" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
          Panel de Control
        </Link>
        <Link href="/dashboard/business" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
          Mi Negocio
        </Link>
        <Link href="/dashboard/favorites" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
          Favoritos
        </Link>
        {(user.role === "ADMIN" || user.role === "EDITOR") && (
          <Link href="/dashboard/admin" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
            Administración
          </Link>
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
