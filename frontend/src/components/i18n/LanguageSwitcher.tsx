import { localeLabels, localeNames, locales } from "../../content/locales";
import { localizedPathForLocale } from "../../content/seo";
import { useI18n } from "./I18nProvider";
import styles from "./LanguageSwitcher.module.css";

export function LanguageSwitcher({ label }: { label: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <div className={styles.switcher} aria-label={label}>
      {locales.map((candidate) => (
        <a
          key={candidate}
          href={localizedPathForLocale(candidate)}
          className={candidate === locale ? styles.active : styles.option}
          onClick={(event) => {
            event.preventDefault();
            setLocale(candidate);
          }}
          aria-current={candidate === locale ? "page" : undefined}
          title={localeLabels[candidate]}
        >
          {localeNames[candidate]}
        </a>
      ))}
    </div>
  );
}
