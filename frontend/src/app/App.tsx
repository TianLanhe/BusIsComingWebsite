import { DownloadSection } from "../components/sections/DownloadSection";
import { FaqSection } from "../components/sections/FaqSection";
import { FeatureGrid } from "../components/sections/FeatureGrid";
import { FooterContact } from "../components/sections/FooterContact";
import { Header } from "../components/sections/Header";
import { HeroSection } from "../components/hero/HeroSection";
import { OnlineQueryDemoSection } from "../components/online-demo/OnlineQueryDemo";
import { SeoHead } from "../components/seo/SeoHead";

export function App() {
  return (
    <>
      <SeoHead />
      <Header />
      <main>
        <HeroSection />
        <FeatureGrid />
        <OnlineQueryDemoSection />
        <DownloadSection />
        <FaqSection />
      </main>
      <FooterContact />
    </>
  );
}
