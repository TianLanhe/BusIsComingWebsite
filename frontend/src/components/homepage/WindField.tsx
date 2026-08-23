import styles from "./WindField.module.css";

export type WindIntensity = "hero" | "route" | "download" | "quiet";

export function WindField({ intensity = "hero", paused = false }: { intensity?: WindIntensity; paused?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={styles.field}
      data-intensity={intensity}
      data-paused={paused ? "true" : "false"}
    >
      <span className={styles.far} />
      <span className={styles.back} />
      <span className={styles.mid} />
      <span className={styles.near} />
      <span className={styles.glow} />
    </div>
  );
}
