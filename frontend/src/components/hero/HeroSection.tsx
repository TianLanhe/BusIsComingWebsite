import { ShieldCheck } from "lucide-react";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import { AppPreviewCarousel } from "./AppPreviewCarousel";
import { HeroIntro } from "./HeroIntro";
import styles from "./HeroSection.module.css";

export function HeroSection() {
  const { text } = useI18n();

  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <HeroIntro />
          <p className={styles.trust}>
            <ShieldCheck aria-hidden="true" size={16} />
            <span>{text(uiCopy.heroTrust)}</span>
          </p>
        </div>
        <div className={styles.right}>
          <AppPreviewCarousel />
        </div>
      </div>
    </section>
  );
}
