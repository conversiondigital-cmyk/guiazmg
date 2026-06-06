import { redirect } from "next/navigation"

export default async function AdminRedirect() {
  redirect("/admin/auditoria")
}
