import brandLogo from "../../assets/brand/busiscoming-logo-foreground.png";
import { homepageContent } from "../../content/homepageContent";
import { homePathForLocale, homepageHrefForTarget } from "../../content/pageRouting";
import type { SeoPageId } from "../../content/types";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import styles from "./Header.module.css";

interface HeaderProps {
  pageId?: SeoPageId;
  hideLanguageSwitcher?: boolean;
}

export function Header({ pageId = "home", hideLanguageSwitcher = false }: HeaderProps) {
  const { locale, text } = useI18n();
  const brandHref = pageId === "privacy" ? homePathForLocale(locale) : "#hero";
  const headerClassName = hideLanguageSwitcher ? `${styles.header} ${styles.headerCompact}` : styles.header;

  return (
    <header className={headerClassName}>
      <a className={styles.brand} href={brandHref} aria-label={text(homepageContent.navigation.brand)}>
        <img src={brandLogo} alt="" aria-hidden="true" />
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
