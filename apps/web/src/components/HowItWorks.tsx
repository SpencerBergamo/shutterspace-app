import styles from "./HowItWorks.module.css";

const steps = [
  {
    number: "01",
    title: "Create an album",
    description:
      "Start a shared home for a trip, wedding, party, or anytime collection. Optionally add event dates and a location.",
  },
  {
    number: "02",
    title: "Invite your people",
    description:
      "Share an invite link or add friends directly. Hosts and moderators keep the roster and permissions in check.",
  },
  {
    number: "03",
    title: "Collect every shot",
    description:
      "Everyone uploads photos and videos into the same album — then like, comment, and relive the moments together.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className={`section ${styles.section}`}>
      <div className="container">
        <div className="section-heading">
          <h2 style={{ fontFamily: "var(--font-sansita), Georgia, serif" }}>
            How Shutterspace works
          </h2>
          <p>
            Built for collaborative albums — not another camera roll you manage
            alone.
          </p>
        </div>

        <ol className={styles.steps}>
          {steps.map((step) => (
            <li key={step.number} className={styles.step}>
              <span className={styles.number} aria-hidden="true">
                {step.number}
              </span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
