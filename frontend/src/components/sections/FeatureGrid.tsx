import { Bell, Bookmark, Clock3, DollarSign, Route, Scale } from "lucide-react";
import { homepageContent } from "../../content/homepageContent";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./FeatureGrid.module.css";

const icons = {
  bookmark: Bookmark,
  scale: Scale,
  clock: Clock3,
  route: Route,
  bell: Bell,
  dollar: DollarSign,
};

export function FeatureGrid() {
  const { text } = useI18n();

  return (
    <section id="features" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h2>{text(uiCopy.featureHeading)}</h2>
        </div>
        <div className={styles.grid} data-testid="feature-grid" data-mobile-columns="2">
          {homepageContent.features.map((feature) => {
            const Icon = icons[feature.icon as keyof typeof icons] ?? Bookmark;
            return (
              <article className={styles.item} key={feature.id} data-testid="feature-card" data-feature-id={feature.id}>
                <Icon aria-hidden="true" size={28} />
                <h3>{text(feature.title)}</h3>
                <p>{text(feature.description)}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
