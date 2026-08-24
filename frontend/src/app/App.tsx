import { DownloadSection } from "../components/sections/DownloadSection";
import { DownloadMetadataProvider } from "../components/download/DownloadMetadataProvider";
import { FaqSection } from "../components/sections/FaqSection";
import { ContactStrip } from "../components/sections/ContactStrip";
import { FooterContact } from "../components/sections/FooterContact";
import { HeroSection } from "../components/hero/HeroSection";
import { OnlineQueryDemoSection } from "../components/online-demo/OnlineQueryDemo";
import { PrivacyPolicyPage } from "../components/privacy/PrivacyPolicyPage";
import { SeoHead } from "../components/seo/SeoHead";
import { currentPageRoute, homePathForLocale } from "../content/pageRouting";

export function App() {
  const { locale, pageId, isPrivacyPage } = currentPageRoute();
  const exactHomepage = typeof window !== "undefined" && locale !== null && window.location.pathname === homePathForLocale(locale);

  const page = (
    <div id="top">
      <SeoHead pageId={pageId} />
      {isPrivacyPage ? (
        <PrivacyPolicyPage />
      ) : (
        <main>
          <HeroSection />
          <OnlineQueryDemoSection />
          <DownloadSection />
          <FaqSection />
          <ContactStrip />
        </main>
      )}
      <FooterContact />
    </div>
  );

  return exactHomepage ? <DownloadMetadataProvider>{page}</DownloadMetadataProvider> : page;
}
