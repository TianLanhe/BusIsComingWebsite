import { homepageContent } from "../../content/homepageContent";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./FaqSection.module.css";

export function FaqSection() {
  const { text } = useI18n();

  return (
    <section id="faq" className={styles.section}>
      <div className={styles.inner}>
        <h2>{text(uiCopy.faqHeading)}</h2>
        <div className={styles.list}>
          {homepageContent.faq.map((item, index) => (
            <details key={item.id} open={index === 0}>
              <summary>{text(item.question)}</summary>
              <p>{text(item.answer)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
