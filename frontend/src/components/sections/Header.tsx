import { homepageContent } from "../../content/homepageContent";
import { homePathForLocale, homepageHrefForTarget } from "../../content/pageRouting";
import type { SeoPageId } from "../../content/types";
import { uiCopy } from "../../content/uiCopy";
import { BrandMark } from "../brand/BrandMark";
import { useI18n } from "../i18n/I18nProvider";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import styles from "./Header.module.css";

export function Header({ pageId = "home", hideLanguageSwitcher = false }: { pageId?: SeoPageId; hideLanguageSwitcher?: boolean }) {
  const { locale, text } = useI18n();
  const brandHref = pageId === "privacy" ? homePathForLocale(locale) : "#top";

  return (
    <header className={styles.header} data-page={pageId}>
      <a className={styles.brand} href={brandHref} aria-label={text(homepageContent.navigation.brand)}>
        <BrandMark />
        <span>{text(homepageContent.navigation.brand)}</span>
      </a>
      <nav className={styles.nav} aria-label={text(uiCopy.primaryNavigation)}>
        {homepageContent.navigation.items.map((item) => (
          <a key={item.id} href={homepageHrefForTarget(locale, item.target, pageId)} data-nav-id={item.id}>
            {text(item.label)}
          </a>
        ))}
      </nav>
      {hideLanguageSwitcher ? null : <LanguageSwitcher label={text(homepageContent.navigation.languageLabel)} />}
    </header>
  );
}
