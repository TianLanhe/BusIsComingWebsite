import { ArrowLeft, BadgeX, Mail, MapPinned, ServerCog, ShieldCheck, type LucideIcon } from "lucide-react";
import { homePathForLocale } from "../../content/pageRouting";
import { privacyPolicyContent } from "../../content/privacyPolicyContent";
import type { SummaryCardId } from "../../content/types";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./PrivacyPolicyPage.module.css";

const summaryIcons: Record<SummaryCardId, LucideIcon> = {
  "no-account-identity": ShieldCheck,
  "no-ads-sale": BadgeX,
  "device-first-saved-routes": MapPinned,
  "external-services-as-needed": ServerCog,
};

export function PrivacyPolicyPage() {
  const { locale, text } = useI18n();
  const { metadata, hero, summaryCards, sections } = privacyPolicyContent;
  const summaryLabel = locale === "en" ? "Privacy summary" : locale === "zh-Hans" ? "隐私摘要" : "私隱摘要";

  return (
    <main className={styles.page}>
      <article className={styles.article} aria-labelledby="privacy-title">
        <a className={styles.backLink} href={homePathForLocale(locale)}>
          <ArrowLeft aria-hidden="true" size={18} />
          {locale === "en" ? "Back to homepage" : locale === "zh-Hans" ? "返回首页" : "返回首頁"}
        </a>

        <header className={styles.hero}>
          <p className={styles.eyebrow}>{text(hero.eyebrow)}</p>
          <h1 id="privacy-title">{text(hero.title)}</h1>
          <p className={styles.lead}>{text(hero.lead)}</p>
          <dl className={styles.meta}>
            <div>
              <dt>{locale === "en" ? "Last updated" : locale === "zh-Hans" ? "最后更新" : "最後更新"}</dt>
              <dd>{metadata.lastUpdated}</dd>
            </div>
            <div>
              <dt>{locale === "en" ? "Contact" : locale === "zh-Hans" ? "联系邮箱" : "聯絡電郵"}</dt>
              <dd>
                <a href={`mailto:${metadata.contactEmail}`}>
                  <Mail aria-hidden="true" size={16} />
                  {metadata.contactEmail}
                </a>
              </dd>
            </div>
          </dl>
        </header>

        <section className={styles.summaryGrid} aria-label={summaryLabel}>
          {summaryCards.map((card) => {
            const Icon = summaryIcons[card.id];
            return (
              <section key={card.id} className={styles.summaryCard}>
                <Icon aria-hidden="true" size={22} />
                <h2>{text(card.title)}</h2>
                <p>{text(card.description)}</p>
              </section>
            );
          })}
        </section>

        <div className={styles.sections}>
          {sections.map((section) => (
            <section key={section.id} className={styles.policySection}>
              <h2>{text(section.title)}</h2>
              {section.paragraphs.map((paragraph, index) => (
                <p key={index}>{text(paragraph)}</p>
              ))}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet, index) => (
                    <li key={index}>{text(bullet)}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
