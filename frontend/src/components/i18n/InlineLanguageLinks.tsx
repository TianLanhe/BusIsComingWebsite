import { homepageContent } from "../../content/homepageContent";
import { localizedPathForLocale } from "../../content/seo";
import { locales } from "../../content/locales";
import type { Locale } from "../../content/types";
import { useI18n } from "./I18nProvider";
import styles from "./InlineLanguageLinks.module.css";

export function InlineLanguageLinks() {
  const { locale, setLocale, text } = useI18n();
  function select(event: React.MouseEvent<HTMLAnchorElement>, nextLocale: Locale) {
    event.preventDefault();
    setLocale(nextLocale);
  }
  return (
    <nav className={styles.languages} aria-label={text(homepageContent.siteChrome.languageLabel)}>
      {locales.map((candidate) => (
        <a
          aria-current={candidate === locale ? "page" : undefined}
          href={localizedPathForLocale(candidate)}
          key={candidate}
          onClick={(event) => select(event, candidate)}
        >
          {homepageContent.siteChrome.languageOptions[candidate]}
        </a>
      ))}
    </nav>
  );
}
