import { DownloadSection } from "../components/sections/DownloadSection";
import { DownloadMetadataProvider } from "../components/download/DownloadMetadataProvider";
import { FaqSection } from "../components/sections/FaqSection";
import { FeatureGrid } from "../components/sections/FeatureGrid";
import { FooterContact } from "../components/sections/FooterContact";
import { Header } from "../components/sections/Header";
import { HeroSection } from "../components/hero/HeroSection";
import { OnlineQueryDemoSection } from "../components/online-demo/OnlineQueryDemo";
import { PrivacyPolicyPage } from "../components/privacy/PrivacyPolicyPage";
import { SeoHead } from "../components/seo/SeoHead";
import { currentPageRoute, homePathForLocale } from "../content/pageRouting";

export function App() {
  const { locale, pageId, isPrivacyPage } = currentPageRoute();
  const exactHomepage = typeof window !== "undefined" && locale !== null && window.location.pathname === homePathForLocale(locale);

  const page = (
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

  return exactHomepage ? <DownloadMetadataProvider>{page}</DownloadMetadataProvider> : page;
}
