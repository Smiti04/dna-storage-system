import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { vaultList, vaultDelete, extractError } from "../services/api";
import { decryptAll } from "../utils/vaultCrypto";

/**
 * KeyVault.jsx
 * ------------
 * Zero-knowledge encrypted retrieval-key manager.
 *
 * The server only stores opaque ciphertext. The user's password decrypts
 * everything locally in the browser using PBKDF2 + AES-GCM.
 */
function KeyVault() {
  const nav = useNavigate();
  const [entries, setEntries] = useState([]);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [decrypted, setDecrypted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await vaultList();
        setEntries(res.data.vault || []);
      } catch (e) {
        setError(extractError(e, "Could not load your vault"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const unlock = async (e) => {
    e?.preventDefault();
    if (!password) return;
    setError("");
    try {
      const results = await decryptAll(entries, password);
      const anyGood = results.some((r) => r.decrypted);
      if (!anyGood && results.length > 0) {
        setError("Wrong password — none of the entries could be decrypted.");
        return;
      }
      setDecrypted(results);
      setUnlocked(true);
      setPassword(""); // scrub from state
    } catch {
      setError("Could not unlock the vault.");
    }
  };

  const lock = () => {
    setDecrypted([]);
    setUnlocked(false);
    setPassword("");
  };

  const copyKey = (id, key) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const removeEntry = async (id) => {
    if (!confirm("Delete this saved key? Cannot be undone.")) return;
    try {
      await vaultDelete(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setDecrypted((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      alert(extractError(e, "Could not delete entry"));
    }
  };

  const sl = { fontSize: "12px", fontWeight: "700", color: "#9a8fc0", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" };

  if (loading) {
    return (
      <div className="page-layout">
        <Sidebar />
        <div className="page-content">
          <div className="card" style={{ color: "#48dbfb", fontWeight: 600 }}>
            Loading vault…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">🔐 Key Vault</div>
        <div className="page-subtitle">
          Retrieval keys encrypted with your password. Zero-knowledge — the server cannot read them.
        </div>

        {/* Empty state */}
        {entries.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>🗄️</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#f0ecf8", marginBottom: "8px" }}>
              Your vault is empty
            </div>
            <div style={{ fontSize: "13px", color: "#9a8fc0", fontWeight: 500, marginBottom: "20px" }}>
              Check "Save key to vault" when uploading a file to store it here, encrypted with your password.
            </div>
            <button className="btn-primary" onClick={() => nav("/upload")}>
              Go to upload
            </button>
          </div>
        ) : !unlocked ? (
          /* Unlock form */
          <form onSubmit={unlock} style={{ maxWidth: "460px", margin: "20px auto" }}>
            <div className="card" style={{
              border: "1px solid rgba(162, 155, 254, 0.3)",
              padding: "28px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#f0ecf8", marginBottom: "10px" }}>
                🔒 Unlock your vault
              </div>
              <div style={{ fontSize: "13px", color: "#9a8fc0", fontWeight: 500, marginBottom: "20px", lineHeight: 1.5 }}>
                You have <strong style={{ color: "#a29bfe" }}>{entries.length}</strong> encrypted key{entries.length === 1 ? "" : "s"}.
                Enter your password to decrypt them in your browser.
              </div>
              <input
                type="password"
                placeholder="Your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "#0a0912",
                  border: "1.5px solid #2a2440",
                  borderRadius: "6px",
                  color: "#f0ecf8",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  marginBottom: "16px",
                }}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={!password}
                style={{ width: "100%" }}
              >
                Unlock
              </button>
              {error && (
                <div style={{
                  marginTop: "14px",
                  padding: "10px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "6px",
                  color: "#ef4444",
                  fontSize: "12px",
                  fontWeight: 500,
                }}>
                  {error}
                </div>
              )}
            </div>
          </form>
        ) : (
          /* Unlocked — show decrypted entries */
          <>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              background: "rgba(72, 219, 251, 0.06)",
              border: "1px solid rgba(72, 219, 251, 0.2)",
              borderRadius: "8px",
              marginBottom: "20px",
            }}>
              <div style={{ fontSize: "13px", color: "#48dbfb", fontWeight: 600 }}>
                ✓ {decrypted.length} key{decrypted.length === 1 ? "" : "s"} unlocked
              </div>
              <button
                onClick={lock}
                style={{
                  padding: "6px 14px",
                  background: "transparent",
                  border: "1px solid #9a8fc066",
                  borderRadius: "5px",
                  color: "#9a8fc0",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                🔒 Lock vault
              </button>
            </div>

            <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
              {decrypted.map((entry) => (
                <div key={entry.id} className="card" style={{ border: "1px solid #2a2440" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#f0ecf8" }}>
                      {entry.filename}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b5f8a", fontWeight: 500 }}>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {entry.decrypted ? (
                    <>
                      <div style={{
                        background: "#0a0912",
                        border: "1px solid #2a2440",
                        borderRadius: "5px",
                        padding: "10px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        color: "#48dbfb",
                        wordBreak: "break-all",
                        marginBottom: "12px",
                      }}>
                        {entry.decrypted}
                      </div>
                      {entry.file_id && (
                        <div style={{ fontSize: "11px", color: "#6b5f8a", fontFamily: "var(--font-mono)", marginBottom: "12px" }}>
                          File ID: {entry.file_id}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => copyKey(entry.id, entry.decrypted)}
                          style={{
                            padding: "6px 12px",
                            background: copiedId === entry.id ? "#22c55e" : "transparent",
                            border: `1px solid ${copiedId === entry.id ? "#22c55e" : "#a29bfe66"}`,
                            borderRadius: "5px",
                            color: copiedId === entry.id ? "#0a0912" : "#a29bfe",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {copiedId === entry.id ? "✓ Copied" : "Copy key"}
                        </button>
                        <button
                          onClick={() => nav("/retrieve", {
                            state: {
                              prefillFileId: entry.file_id,
                              prefillKey: entry.decrypted,
                            },
                          })}
                          style={{
                            padding: "6px 12px",
                            background: "transparent",
                            border: "1px solid #48dbfb44",
                            borderRadius: "5px",
                            color: "#48dbfb",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Retrieve file
                        </button>
                        <button
                          onClick={() => removeEntry(entry.id)}
                          style={{
                            padding: "6px 12px",
                            background: "transparent",
                            border: "1px solid #ef444444",
                            borderRadius: "5px",
                            color: "#ef4444",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                            marginLeft: "auto",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{
                      padding: "10px",
                      background: "rgba(240, 147, 43, 0.1)",
                      border: "1px solid rgba(240, 147, 43, 0.3)",
                      borderRadius: "5px",
                      color: "#f0932b",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}>
                      ⚠ Could not decrypt — saved with a different password?
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default KeyVault;
