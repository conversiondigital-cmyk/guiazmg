import { redirect } from "next/navigation"
export default function AdminEditoresRedirect() { redirect("/admin/usuarios?role=EDITOR") }
