import styles from "./Features.module.css";

const features = [
  {
    title: "Albums that belong to a Host",
    description:
      "Every album has a clear owner. Hosts can invite, moderate, transfer ownership, or archive when the event is over.",
  },
  {
    title: "Invite links & friends",
    description:
      "Bring people in with a short invite code, or add friends you already know in-app. Auto-accept or approve new members.",
  },
  {
    title: "Photos and video together",
    description:
      "Images and videos live side by side in the same album gallery — ready to browse, like, and comment on.",
  },
  {
    title: "Roles that match real life",
    description:
      "Members upload and manage their own media. Moderators help keep things tidy. Hosts stay in control.",
  },
  {
    title: "Event-aware albums",
    description:
      "Optional date ranges and locations turn an album into the home for a wedding, trip, or night out.",
  },
  {
    title: "Storage that scales with you",
    description:
      "Free tier includes generous shared storage, with room to grow as your albums fill up.",
  },
];

export function Features() {
  return (
    <section id="features" className={`section ${styles.section}`}>
      <div className="container">
        <div className="section-heading">
          <h2 style={{ fontFamily: "var(--font-sansita), Georgia, serif" }}>
            Built for sharing, not scrolling alone
          </h2>
          <p>
            Shutterspace is a collaborative album app — so the people who were
            there can contribute, not just look.
          </p>
        </div>

        <div className={styles.grid}>
          {features.map((feature) => (
            <article key={feature.title} className={styles.item}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
