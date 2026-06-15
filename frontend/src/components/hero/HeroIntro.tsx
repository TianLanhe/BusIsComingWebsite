import { Bell, Bookmark, Clock3, Search } from "lucide-react";
import { homepageContent } from "../../content/homepageContent";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./HeroIntro.module.css";

const bulletIcons = [Bookmark, Clock3, Bell];

export function HeroIntro() {
  const { text } = useI18n();

  return (
    <div className={styles.intro}>
      <h1>{text(homepageContent.hero.headline)}</h1>
      <p className={styles.subheading}>{text(homepageContent.hero.subheading)}</p>

      <ul className={styles.bullets}>
        {homepageContent.hero.bullets.map((bullet, index) => {
          const Icon = bulletIcons[index] ?? Bookmark;
          return (
            <li key={text(bullet.title)}>
              <Icon aria-hidden="true" size={23} />
              <span>
                <strong>{text(bullet.title)}</strong>
                <small>{text(bullet.description)}</small>
              </span>
            </li>
          );
        })}
      </ul>

      <div className={styles.actions}>
        <a className={styles.primary} href={homepageContent.hero.primaryAction.target}>
          {text(homepageContent.hero.primaryAction.label)}
        </a>
        <a className={styles.secondary} href={homepageContent.hero.secondaryAction.target}>
          <Search aria-hidden="true" size={19} />
          {text(homepageContent.hero.secondaryAction.label)}
        </a>
      </div>
    </div>
  );
}
