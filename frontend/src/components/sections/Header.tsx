import brandLogo from "../../assets/brand/busiscoming-logo-foreground.png";
import { homepageContent } from "../../content/homepageContent";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import styles from "./Header.module.css";

export function Header() {
  const { text } = useI18n();

  return (
    <header className={styles.header}>
      <a className={styles.brand} href="#hero" aria-label={text(homepageContent.navigation.brand)}>
        <img src={brandLogo} alt="" aria-hidden="true" />
        <span>{text(homepageContent.navigation.brand)}</span>
      </a>

      <nav className={styles.nav} aria-label={text(uiCopy.primaryNavigation)}>
        {homepageContent.navigation.items.map((item) => (
          <a key={item.id} href={item.target} data-nav-id={item.id}>
            {text(item.label)}
          </a>
        ))}
      </nav>

      <LanguageSwitcher label={text(homepageContent.navigation.languageLabel)} />
    </header>
  );
}
