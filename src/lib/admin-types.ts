export interface SidebarSection {
  title: string
  items: SidebarItem[]
}

export interface SidebarItem {
  label: string
  href: string
  icon: string
  roles: ("ADMIN" | "EDITOR" | "SALES_AGENT")[]
}
