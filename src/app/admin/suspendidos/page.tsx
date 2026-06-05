import { redirect } from "next/navigation"
export default function AdminSuspendidosRedirect() { redirect("/admin/usuarios?status=INACTIVE") }
