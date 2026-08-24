import appIcon from "../../assets/brand/busiscoming-icon.webp";
import { homepageContent } from "../../content/homepageContent";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./AppBrand.module.css";

export function AppBrand({ href = "#top", compact = false }: { href?: string; compact?: boolean }) {
  const { text } = useI18n();
  const brandName = text(homepageContent.siteChrome.brandName);
  return (
    <a className={styles.brand} data-compact={compact ? "true" : "false"} href={href}>
      <img alt={brandName} height="48" src={appIcon} width="48" />
      <span>{brandName}</span>
    </a>
  );
}
