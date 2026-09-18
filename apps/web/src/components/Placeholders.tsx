import styles from "./Placeholders.module.css";

export function ProductPreviewPlaceholder() {
  return (
    <section id="product" className={`section ${styles.section}`}>
      <div className="container">
        <div className="section-heading">
          <h2 style={{ fontFamily: "var(--font-sansita), Georgia, serif" }}>
            Inside the app
          </h2>
          <p>
            A look at albums, invites, and the gallery — graphics coming soon.
          </p>
        </div>

        <div className="placeholder-block" aria-label="Product graphics placeholder">
          <div>
            <span className="placeholder-label">Placeholder</span>
            <h3>In-app graphics</h3>
            <p>
              Screenshots and motion previews of the Shutterspace album
              experience will live here.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function UseCasesPlaceholder() {
  return (
    <section id="stories" className={`section ${styles.muted}`}>
      <div className="container">
        <div className="section-heading">
          <h2 style={{ fontFamily: "var(--font-sansita), Georgia, serif" }}>
            Made for real moments
          </h2>
          <p>Weddings, weekends away, reunions — use cases coming soon.</p>
        </div>

        <div className={styles.useCaseGrid}>
          {["Weddings & celebrations", "Trips with friends", "Family archives"].map(
            (label) => (
              <div
                key={label}
                className="placeholder-block"
                aria-label={`${label} placeholder`}
              >
                <div>
                  <span className="placeholder-label">Example use case</span>
                  <h3>{label}</h3>
                  <p>Story and imagery will be added here.</p>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

export function FeedbackPlaceholder() {
  return (
    <section id="feedback" className={`section ${styles.section}`}>
      <div className="container">
        <div className="section-heading">
          <h2 style={{ fontFamily: "var(--font-sansita), Georgia, serif" }}>
            Loved by early sharers
          </h2>
          <p>Real feedback from people using Shutterspace will appear here.</p>
        </div>

        <div className={styles.feedbackGrid}>
          {[1, 2, 3].map((n) => (
            <blockquote
              key={n}
              className={`placeholder-block ${styles.quote}`}
              aria-label="User feedback placeholder"
            >
              <div>
                <span className="placeholder-label">User feedback</span>
                <h3>Quote coming soon</h3>
                <p>
                  We&apos;ll share what Hosts and members say once we have
                  stories ready to publish.
                </p>
              </div>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
