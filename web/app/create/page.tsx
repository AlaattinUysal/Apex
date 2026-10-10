import { redirect } from "next/navigation";

// Landing "Ders oluştur" bağlantıları /create'e gider; ders oluşturma öğretmen panelinde (/dashboard).
export default function CreatePage() {
  redirect("/dashboard");
}
