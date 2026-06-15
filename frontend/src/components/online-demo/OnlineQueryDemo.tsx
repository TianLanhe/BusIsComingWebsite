import { ArrowLeftRight, Info, Search } from "lucide-react";
import { onlineQueryDemo } from "../../content/onlineQueryDemo";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./OnlineQueryDemo.module.css";

export function OnlineQueryDemoSection() {
  const { text } = useI18n();

  return (
    <section id="online-query" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h2>{text(onlineQueryDemo.title)}</h2>
          <p>{text(onlineQueryDemo.limitationNotice)}</p>
        </div>

        <div className={styles.demo} data-testid="online-query-demo">
          <div className={styles.queryBar}>
            <label>
              <span>{text(uiCopy.originLabel)}</span>
              <input value={text(onlineQueryDemo.origin)} readOnly />
            </label>
            <ArrowLeftRight aria-hidden="true" className={styles.swap} size={22} />
            <label>
              <span>{text(uiCopy.destinationLabel)}</span>
              <input value={text(onlineQueryDemo.destination)} readOnly />
            </label>
            <button type="button" onClick={(event) => event.preventDefault()}>
              <Search aria-hidden="true" size={18} />
              {text(uiCopy.queryButton)}
            </button>
          </div>

          <div className={styles.resultHeader}>
            <strong>{text(uiCopy.sampleResult)}</strong>
            <span>{text(uiCopy.dataReference)}</span>
          </div>

          <div className={styles.results}>
            {onlineQueryDemo.resultRows.map((row) => (
              <article className={styles.routeRow} key={row.routeNumber}>
                <div className={styles.routeMain}>
                  <span className={styles.routeNumber}>{row.routeNumber}</span>
                  <strong>{row.operator}</strong>
                  <em>{row.etaDisplay && text(row.etaDisplay)}</em>
                </div>
                <dl>
                  <div>
                    <dt>{text(uiCopy.fareLabel)}</dt>
                    <dd>{row.fare}</dd>
                  </div>
                  <div>
                    <dt>{text(uiCopy.durationLabel)}</dt>
                    <dd>{text(row.duration)}</dd>
                  </div>
                  <div>
                    <dt>{text(uiCopy.walkingLabel)}</dt>
                    <dd>{text(row.walkingDistance)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <p className={styles.notice}>
            <Info aria-hidden="true" size={18} />
            <span>{text(onlineQueryDemo.scopeNotice)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
