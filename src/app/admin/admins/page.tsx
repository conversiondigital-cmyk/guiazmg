import { redirect } from "next/navigation"

export default async function AdminAdminsRedirect() {
  redirect("/admin/usuarios?role=ADMIN")
}
