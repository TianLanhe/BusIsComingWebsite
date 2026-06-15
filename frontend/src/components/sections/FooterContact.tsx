import { BusFront, Mail } from "lucide-react";
import { homepageContent } from "../../content/homepageContent";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./FooterContact.module.css";

export function FooterContact() {
  const { text } = useI18n();
  const entry = homepageContent.contact[0];

  return (
    <footer id="contact" className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <BusFront aria-hidden="true" size={28} />
          <strong>{text(homepageContent.navigation.brand)}</strong>
        </div>
        <div className={styles.contact}>
          <h2>{text(entry.label)}</h2>
          <p>{text(entry.description)}</p>
          <a href={entry.href}>
            <Mail aria-hidden="true" size={18} />
            feedback@busiscoming.local
          </a>
        </div>
      </div>
    </footer>
  );
}
