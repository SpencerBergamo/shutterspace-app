import styles from "./DownloadCta.module.css";

export function DownloadCta() {
  return (
    <section id="download" className={styles.section}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.brand}>Shutterspace</p>
        <h2>Start collecting memories together.</h2>
        <p className={styles.support}>
          Available for iOS and Android. Download the app, create your first
          album, and invite the people who were there.
        </p>
        <div className={styles.actions}>
          <span className={`btn btn-primary ${styles.store}`} aria-disabled="true">
            App Store — coming soon
          </span>
          <span className={`btn btn-secondary ${styles.store}`} aria-disabled="true">
            Google Play — coming soon
          </span>
        </div>
      </div>
    </section>
  );
}
