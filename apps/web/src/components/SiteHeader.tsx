"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./SiteHeader.module.css";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#stories", label: "Stories" },
  { href: "#download", label: "Get the app" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={`container ${styles.inner}`}>
        <a href="#top" className={styles.brand}>
          <Image
            src="/images/logo.png"
            alt=""
            width={36}
            height={32}
            className={styles.logo}
            priority
          />
          <span className={styles.brandName}>Shutterspace</span>
        </a>

        <nav className={styles.nav} aria-label="Primary">
          {links.map((link) => (
            <a key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </a>
          ))}
        </nav>

        <a href="#download" className={`btn btn-accent ${styles.cta}`}>
          Get the app
        </a>
      </div>
    </header>
  );
}
