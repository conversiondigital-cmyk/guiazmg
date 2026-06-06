import { redirect } from "next/navigation"

export default async function AdminActividadRedirect() {
  redirect("/admin/auditoria")
}
