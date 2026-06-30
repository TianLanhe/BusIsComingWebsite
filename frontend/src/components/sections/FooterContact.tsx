import { Mail } from "lucide-react";
import brandLogo from "../../assets/brand/busiscoming-logo-foreground.png";
import { homepageContent } from "../../content/homepageContent";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./FooterContact.module.css";

export function FooterContact() {
  const { locale, text } = useI18n();
  const entry = homepageContent.contact[0];
  const privacyLink = homepageContent.footerPrivacyLink;

  return (
    <footer id="contact" className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <img src={brandLogo} alt="" aria-hidden="true" />
          <strong>{text(homepageContent.navigation.brand)}</strong>
        </div>
        <div className={styles.contact}>
          <h2>{text(entry.label)}</h2>
          <p>{text(entry.description)}</p>
          <a href={entry.href}>
            <Mail aria-hidden="true" size={18} />
            {homepageContent.homepageExperience.contact.email}
          </a>
          <a className={styles.privacyLink} href={privacyLink.href[locale]}>
            {text(privacyLink.label)}
          </a>
        </div>
      </div>
    </footer>
  );
}
