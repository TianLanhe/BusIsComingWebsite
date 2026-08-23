import { homepageContent } from "../../content/homepageContent";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./ContactStrip.module.css";

export function ContactStrip() {
  const { text } = useI18n();
  return (
    <section className={styles.section} id="contact">
      <a href={homepageContent.supportEnding.contact.target}>
        <span><small>{text({ "zh-Hant": "還有問題？", "zh-Hans": "还有问题？", en: "Still have a question?" })}</small><strong>{text(homepageContent.supportEnding.contact.label)}</strong></span>
        <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}
