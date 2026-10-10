"use client";

import { useEffect } from "react";

// Landing, 1280px genişlikteki tasarım tuvaline göre çizildi. Daha geniş ekranlarda sayfa orantılı
// büyür (CSS zoom), böylece içerik tasarımdaki gibi ekranı doldurur; 1280px'in altında zoom = 1.
// --lp-zoom değişkenini html'e yazar (.lp-zoom sınıfı kullanır).
const BASE = 1280;

// İlk boyamada zıplama olmasın diye değer, sayfa HTML'i ile birlikte (React'ten önce) hesaplanır.
const INLINE = `(function(){var d=document.documentElement;d.style.setProperty('--lp-zoom',Math.max(1,d.clientWidth/${BASE}).toFixed(4))})()`;

export function LandingZoom() {
  // İlk boyamadan sonra ve istemci tarafı geçişlerde yeniden boyutlandırmayı yalnızca
  // bu effect yönetir; satır içi betik temizlenemeyen ikinci bir dinleyici eklemez.
  useEffect(() => {
    const d = document.documentElement;
    const apply = () => d.style.setProperty("--lp-zoom", Math.max(1, d.clientWidth / BASE).toFixed(4));
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      d.style.removeProperty("--lp-zoom");
    };
  }, []);

  return <script dangerouslySetInnerHTML={{ __html: INLINE }} />;
}
