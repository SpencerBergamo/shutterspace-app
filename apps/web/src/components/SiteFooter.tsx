import Image from "next/image";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandBlock}>
          <div className={styles.brandRow}>
            <Image
              src="/images/logo.png"
              alt=""
              width={28}
              height={24}
              className={styles.logo}
            />
            <span className={styles.brandName}>Shutterspace</span>
          </div>
          <p>Collaborative photo and video albums for every shared moment.</p>
        </div>

        <div className={styles.links}>
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#download">Get the app</a>
          <a href="https://shutterspace.app/privacy">Privacy</a>
          <a href="https://shutterspace.app/terms">Terms</a>
        </div>
      </div>
      <div className={`container ${styles.copy}`}>
        <p>© {new Date().getFullYear()} Shutterspace. All rights reserved.</p>
      </div>
    </footer>
  );
}
