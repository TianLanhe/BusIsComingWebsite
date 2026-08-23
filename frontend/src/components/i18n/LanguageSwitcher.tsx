import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { localeLabels, locales } from "../../content/locales";
import { localizedPathForLocale } from "../../content/seo";
import type { Locale } from "../../content/types";
import { useI18n } from "./I18nProvider";
import styles from "./LanguageSwitcher.module.css";

const compactNames: Record<Locale, string> = { "zh-Hant": "繁體", "zh-Hans": "简体", en: "EN" };

export function LanguageSwitcher({ label }: { label: string }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, [open]);

  function select(nextLocale: Locale) {
    setLocale(nextLocale);
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const current = optionRefs.current.findIndex((node) => node === document.activeElement);
    const next = event.key === "Home"
      ? 0
      : event.key === "End"
        ? locales.length - 1
        : event.key === "ArrowDown"
          ? (current + 1 + locales.length) % locales.length
          : (current - 1 + locales.length) % locales.length;
    optionRefs.current[next]?.focus();
  }

  return (
    <div className={styles.switcher} ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className={styles.trigger}
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        type="button"
      >
        <span>{compactNames[locale]}</span>
        <span aria-hidden="true" className={styles.chevron}>⌄</span>
      </button>
      {open ? (
        <div className={styles.menu} id={menuId} role="menu" onKeyDown={handleMenuKeyDown}>
          {locales.map((candidate, index) => (
            <a
              aria-current={candidate === locale ? "true" : undefined}
              href={localizedPathForLocale(candidate)}
              key={candidate}
              onClick={(event) => { event.preventDefault(); select(candidate); }}
              ref={(node) => { optionRefs.current[index] = node; }}
              role="menuitem"
              tabIndex={candidate === locale ? 0 : -1}
            >
              {localeLabels[candidate]}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
