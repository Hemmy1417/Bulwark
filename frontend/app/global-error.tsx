"use client";

/**
 * Catastrophic boundary that runs when the root layout itself throws —
 * must render its own <html> and <body>. Kept intentionally minimal so
 * it can't cascade another failure. Everyday route errors are handled
 * by app/error.tsx and preserve the frame.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0B1F3A",
          color: "#F3EEDF",
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "34rem", textAlign: "center" }}>
          <div
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#C9A961",
              marginBottom: "0.75rem",
            }}
          >
            System notice — root failure
          </div>
          <h1
            style={{
              fontFamily: "'EB Garamond', ui-serif, Georgia, serif",
              fontSize: "2rem",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              margin: "0 0 1rem",
            }}
          >
            Bulwark could not initialise
          </h1>
          <p
            style={{
              color: "rgba(243, 238, 223, 0.7)",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              margin: "0 0 1.5rem",
            }}
          >
            The root layout failed to render. This is exceptional; contract
            state on-chain is untouched. Please retry or reload the page.
          </p>
          {error?.digest && (
            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "0.7rem",
                color: "rgba(243, 238, 223, 0.4)",
                marginBottom: "1.5rem",
              }}
            >
              Digest {error.digest}
            </div>
          )}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#C9A961",
              color: "#0B1F3A",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "2px",
              fontFamily: "'EB Garamond', ui-serif, serif",
              fontSize: "0.95rem",
              letterSpacing: "0.06em",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
