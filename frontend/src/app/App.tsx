import { DownloadSection } from "../components/sections/DownloadSection";
import { FaqSection } from "../components/sections/FaqSection";
import { FeatureGrid } from "../components/sections/FeatureGrid";
import { FooterContact } from "../components/sections/FooterContact";
import { Header } from "../components/sections/Header";
import { HeroSection } from "../components/hero/HeroSection";
import { OnlineQueryDemoSection } from "../components/online-demo/OnlineQueryDemo";
import { PrivacyPolicyPage } from "../components/privacy/PrivacyPolicyPage";
import { SeoHead } from "../components/seo/SeoHead";
import { currentPageRoute } from "../content/pageRouting";

export function App() {
  const { pageId, isPrivacyPage } = currentPageRoute();

  return (
    <>
      <SeoHead pageId={pageId} />
      <Header pageId={pageId} hideLanguageSwitcher={isPrivacyPage} />
      {isPrivacyPage ? (
        <PrivacyPolicyPage />
      ) : (
        <main>
          <HeroSection />
          <FeatureGrid />
          <OnlineQueryDemoSection />
          <DownloadSection />
          <FaqSection />
        </main>
      )}
      <FooterContact />
    </>
  );
}
