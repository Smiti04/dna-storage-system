import { useEffect, useState } from "react";
import { checkBackendHealth } from "../services/api";

const MAX_WAIT_MS = 120_000;
const POLL_INTERVAL_MS = 4_000;

export default function BackendLoader({ children }) {
  const [ready, setReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = Math.ceil(MAX_WAIT_MS / POLL_INTERVAL_MS);

    const tick = async () => {
      if (cancelled) return;
      attempts++;
      try {
        await checkBackendHealth();
        if (!cancelled) setReady(true);
        return;
      } catch {
        // still sleeping
      }
      if (attempts >= maxAttempts) {
        if (!cancelled) setTimedOut(true);
        return;
      }
      if (!cancelled) setElapsed(attempts * POLL_INTERVAL_MS);
      setTimeout(tick, POLL_INTERVAL_MS);
    };

    tick();
    return () => { cancelled = true; };
  }, []);

  if (ready) return children;

  const seconds = Math.round(elapsed / 1000);

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.dna}>
          <span style={{ ...styles.base, color: "var(--lavender)" }}>A</span>
          <span style={{ ...styles.base, color: "var(--ice)" }}>T</span>
          <span style={{ ...styles.base, color: "var(--amber)" }}>G</span>
          <span style={{ ...styles.base, color: "var(--green)" }}>C</span>
        </div>
        <div style={styles.spinner} />
        {timedOut ? (
          <>
            <p style={styles.title}>Backend unreachable</p>
            <p style={styles.sub}>
              The server didn't respond in time. Please refresh or try again shortly.
            </p>
            <button style={styles.btn} onClick={() => window.location.reload()}>
              Retry
            </button>
          </>
        ) : (
          <>
            <p style={styles.title}>Starting up backend…</p>
            <p style={styles.sub}>
              The server is waking up from sleep (free tier). This usually takes
              20–60 seconds. Please wait.
            </p>
            {seconds > 0 && <p style={styles.timer}>Waiting {seconds}s…</p>}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", padding: "24px" },
  card: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "48px 40px", maxWidth: 420, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" },
  dna: { fontFamily: "var(--font-mono)", fontSize: "28px", fontWeight: 700, letterSpacing: "6px", marginBottom: "4px" },
  base: { display: "inline-block", animation: "pulse 1.4s ease-in-out infinite" },
  spinner: { width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--lavender)", animation: "spin 0.8s linear infinite" },
  title: { fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" },
  sub: { fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 320 },
  timer: { fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" },
  btn: { marginTop: "8px", padding: "10px 24px", background: "var(--lavender)", border: "none", borderRadius: "var(--radius-sm)", color: "#0a0912", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "14px", cursor: "pointer" },
};
