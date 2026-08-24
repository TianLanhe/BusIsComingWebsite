import { homepageContent } from "../../content/homepageContent";
import { uiCopy } from "../../content/uiCopy";
import { AppBrand } from "../brand/AppBrand";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./FooterContact.module.css";

export function FooterContact() {
  const { locale, text } = useI18n();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <AppBrand href="#top" />
        <nav aria-label={text({ "zh-Hant": "頁尾導覽", "zh-Hans": "页尾导航", en: "Footer navigation" })}>
          <a href="#faq">{text(uiCopy.footerFaqLink)}</a>
          <a href={homepageContent.supportEnding.privacyLink.href[locale]}>{text(homepageContent.supportEnding.privacyLink.label)}</a>
          <a href={homepageContent.supportEnding.backToTop.target}>{text(homepageContent.supportEnding.backToTop.label)}</a>
        </nav>
        <p>{text(homepageContent.hero.productPositioning)}</p>
        <small>© 2026 BusIsComing</small>
      </div>
    </footer>
  );
}
