import { useState } from "react";
import { homepageContent } from "../../content/homepageContent";
import type { HomepageFaqItem } from "../../content/types";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./FaqSection.module.css";

export function FaqSection() {
  const { text } = useI18n();
  const [activeFaqId, setActiveFaqId] = useState<HomepageFaqItem["id"] | null>("android-install");

  return (
    <section id="faq" className={styles.section}>
      <div className={styles.inner}>
        <header>
          <p>04 / FAQ</p>
          <h2>{text(homepageContent.supportEnding.title)}</h2>
        </header>
        <div className={styles.list}>
          {homepageContent.supportEnding.faq.map((item, index) => {
            const open = item.id === activeFaqId;
            const buttonId = "faq-button-" + item.id;
            const panelId = "faq-panel-" + item.id;
            return (
              <article className={styles.item} data-open={open ? "true" : "false"} key={item.id}>
                <button
                  aria-controls={panelId}
                  aria-expanded={open}
                  id={buttonId}
                  onClick={() => setActiveFaqId(open ? null : item.id)}
                  type="button"
                >
                  <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
                  <span>{text(item.question)}</span>
                  <span className={styles.toggle} aria-hidden="true">{open ? "−" : "+"}</span>
                </button>
                <div
                  aria-hidden={!open}
                  aria-labelledby={buttonId}
                  className={styles.panel}
                  id={panelId}
                  role="region"
                >
                  <div><p>{text(item.answer)}</p></div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
