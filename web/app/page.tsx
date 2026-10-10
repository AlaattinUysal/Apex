import { Audience } from "@/components/landing/audience";
import { ClosingCta } from "@/components/landing/closing-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingZoom } from "@/components/landing/landing-zoom";
import { TrustStrip } from "@/components/landing/trust-strip";

// Landing: her bölüm components/landing/ altında ayrı bileşen. 1280px tasarım tuvaline göre çizildi,
// daha geniş ekranda orantılı büyür (LandingZoom).
export default function Home() {
  return (
    <div className="lp-zoom min-h-[calc(100vh/var(--lp-zoom,1))] bg-paper text-ink">
      <LandingZoom />
      <LandingHeader />
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <Audience />
      <ClosingCta />
      <LandingFooter />
    </div>
  );
}
