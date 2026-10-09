import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Tasarım yazı tipleri: başlıklar Fraunces, gövde Hanken Grotesk, kod/sayaç JetBrains Mono.
// "latin-ext": Türkçe karakterler (ğ, ş, ı, İ …) için gerekli.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// opsz (optik boyut) ekseni: büyük puntoda harfler daha dar/ince çizilir; tasarım taslağı da bu eksenle yükleniyor.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Apex — Canlı derste anonim soru",
  description:
    "Öğrenciler dersi bölmeden anonim soru yazar; Apex 5 dakikada bir mesajları toplar, uygunsuzları eler ve öğretmene konu konu özet sunar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${hanken.variable} ${fraunces.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
