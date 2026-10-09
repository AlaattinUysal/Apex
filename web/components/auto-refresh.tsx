"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Öğrenci tarayıcısı Supabase'e doğrudan erişemez (RLS), bu yüzden ders durumu
// değişince (başladı/bitti) sayfayı sunucudan periyodik olarak yeniler.
export function AutoRefresh({ everyMs = 8000 }: { everyMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), everyMs);
    return () => clearInterval(id);
  }, [router, everyMs]);

  return null;
}
