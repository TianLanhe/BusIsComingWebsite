import { localeLabels, localeNames, locales } from "../../content/locales";
import { useI18n } from "./I18nProvider";
import styles from "./LanguageSwitcher.module.css";

export function LanguageSwitcher({ label }: { label: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <div className={styles.switcher} aria-label={label}>
      {locales.map((candidate) => (
        <button
          key={candidate}
          type="button"
          className={candidate === locale ? styles.active : styles.option}
          onClick={() => setLocale(candidate)}
          aria-pressed={candidate === locale}
          title={localeLabels[candidate]}
        >
          {localeNames[candidate]}
        </button>
      ))}
    </div>
  );
}
