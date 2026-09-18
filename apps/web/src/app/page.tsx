import { DownloadCta } from "@/components/DownloadCta";
import { Features } from "@/components/Features";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import {
  FeedbackPlaceholder,
  ProductPreviewPlaceholder,
  UseCasesPlaceholder,
} from "@/components/Placeholders";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <ProductPreviewPlaceholder />
        <UseCasesPlaceholder />
        <FeedbackPlaceholder />
        <DownloadCta />
      </main>
      <SiteFooter />
    </>
  );
}
