import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section id="top" className={styles.hero} aria-labelledby="hero-brand">
      <div className={styles.atmosphere} aria-hidden="true">
        <div className={styles.wash} />
        <div className={styles.ring} />
        <div className={`${styles.ring} ${styles.ringDelayed}`} />
        <div className={styles.grain} />
        <div className={styles.photoPlane} />
      </div>

      <div className={`container ${styles.content}`}>
        <p className={styles.brand} id="hero-brand">
          Shutterspace
        </p>
        <h1 className={styles.headline}>
          Shared albums for the moments you actually want to keep.
        </h1>
        <p className={styles.support}>
          Create a collaborative album for your trip, party, or everyday life —
          then invite friends so every photo and video lands in one place.
        </p>
        <div className={styles.actions}>
          <a href="#download" className="btn btn-primary">
            Download the app
          </a>
          <a href="#how-it-works" className="btn btn-secondary">
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}
