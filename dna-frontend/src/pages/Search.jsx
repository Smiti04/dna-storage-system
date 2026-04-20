import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { searchFiles, extractError } from "../services/api";

function Search() {
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Client-side preview of what the server will treat this as
  const detectMode = (q) => {
    const clean = q.trim();
    if (!clean) return null;
    // 32-char hex = retrieval key
    if (/^[0-9a-fA-F]{32}$/.test(clean)) return "key";
    // >=12 ATGC bases = DNA
    const dnaClean = clean.replace(/\s+/g, "").toUpperCase();
    if (/^[ATGC]+$/.test(dnaClean) && dnaClean.length >= 12) return "dna";
    return "tag";
  };

  const preview = detectMode(query);

  const modeInfo = {
    key: { label: "Retrieval key", color: "#a29bfe", icon: "🔑" },
    dna: { label: "DNA segment", color: "#48dbfb", icon: "🧬" },
    tag: { label: "Keyword / tag", color: "#f0932b", icon: "🏷️" },
  };

  const runSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    setHasSearched(true);
    try {
      const res = await searchFiles(query.trim());
      setMode(res.data.mode);
      setResults(res.data.results || []);
      if (!res.data.results?.length) {
        setError("No matches found. Try a different keyword or DNA segment.");
      }
    } catch (err) {
      setError(extractError(err, "Search failed"));
    } finally {
      setLoading(false);
    }
  };

  const sl = { fontSize: "12px", fontWeight: "700", color: "#9a8fc0", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">Search the Vault</div>
        <div className="page-subtitle">Find files by retrieval key, DNA segment, or keyword tag</div>

        {/* Search input */}
        <form onSubmit={runSearch} style={{ marginBottom: "20px" }}>
          <div style={{
            display: "flex",
            gap: "10px",
            background: "#12101e",
            border: `1.5px solid ${preview ? modeInfo[preview].color + "66" : "#2a2440"}`,
            borderRadius: "8px",
            padding: "8px",
            transition: "border-color 0.2s",
          }}>
            <input
              type="text"
              placeholder="Paste a retrieval key, DNA segment (≥12 bases), or a keyword…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#f0ecf8",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                padding: "10px 12px",
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !query.trim()}
              style={{ minWidth: "110px" }}
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
          {preview && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: modeInfo[preview].color, fontWeight: 600 }}>
              {modeInfo[preview].icon} Detected: <strong>{modeInfo[preview].label}</strong>
            </div>
          )}
        </form>

        {/* How it works panel */}
        <div className="card" style={{
          marginBottom: "24px",
          borderLeft: "3px solid #48dbfb",
          background: "rgba(72, 219, 251, 0.04)",
        }}>
          <div style={sl}>How search works</div>
          <div style={{ fontSize: "13px", color: "#c4b5fd", lineHeight: 1.7, fontWeight: 500 }}>
            <div style={{ marginBottom: "6px" }}>
              <span style={{ color: "#a29bfe", fontWeight: 700 }}>🔑 Retrieval key</span> — paste the full key from your saved .txt file to jump to that file.
            </div>
            <div style={{ marginBottom: "6px" }}>
              <span style={{ color: "#48dbfb", fontWeight: 700 }}>🧬 DNA segment</span> — paste at least 12 bases (A/T/G/C). Matched against a k-mer index and ranked by overlap score.
            </div>
            <div>
              <span style={{ color: "#f0932b", fontWeight: 700 }}>🏷️ Keyword</span> — matches any tag you added at upload or the original filename. Case-insensitive.
            </div>
          </div>
        </div>

        {/* Error / empty state */}
        {error && (
          <div className="card" style={{
            borderLeft: "3px solid #ef4444",
            color: "#ef4444",
            fontSize: "13px",
            fontWeight: 500,
            marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ ...sl, marginBottom: 0 }}>
                {results.length} result{results.length === 1 ? "" : "s"}
              </div>
              {mode && (
                <span style={{
                  padding: "3px 12px",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: `${modeInfo[mode]?.color || "#9a8fc0"}22`,
                  color: modeInfo[mode]?.color || "#9a8fc0",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  {mode} match
                </span>
              )}
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              {results.map((r, i) => (
                <div key={`${r.file_id}-${i}`} className="card" style={{
                  border: "1px solid #2a2440",
                  transition: "border-color 0.15s, transform 0.15s",
                }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = "#a29bfe66"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = "#2a2440"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "12px", marginBottom: "10px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "#f0ecf8", marginBottom: "4px" }}>
                        {r.filename}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#9a8fc0", wordBreak: "break-all" }}>
                        ID: {r.file_id}
                        {r.encoding_type && (
                          <span style={{ marginLeft: "10px", color: "#6b5f8a" }}>
                            · {r.encoding_type === "6base" ? "6-Base Epigenetic" : "4-Base Standard"}
                          </span>
                        )}
                      </div>
                    </div>
                    {r.score !== undefined && (
                      <div style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        background: "linear-gradient(135deg, #48dbfb, #a29bfe)",
                        color: "#0a0912",
                        fontWeight: 700,
                        fontSize: "12px",
                        whiteSpace: "nowrap",
                      }}>
                        {(r.score * 100).toFixed(0)}% match
                      </div>
                    )}
                  </div>

                  {r.match_type === "dna_segment" && (
                    <div style={{ fontSize: "12px", color: "#9a8fc0", marginBottom: "10px", fontWeight: 500 }}>
                      Matched {r.matched_kmers}/{r.total_kmers} k-mers
                    </div>
                  )}

                  {r.tags?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "12px" }}>
                      {r.tags.map((t) => (
                        <span key={t} style={{
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background: "rgba(240, 147, 43, 0.15)",
                          border: "1px solid rgba(240, 147, 43, 0.3)",
                          color: "#f0932b",
                          fontSize: "11px",
                          fontWeight: 500,
                        }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => nav("/retrieve", { state: { prefillFileId: r.file_id } })}
                      style={{
                        padding: "6px 14px",
                        background: "transparent",
                        border: "1px solid #a29bfe66",
                        borderRadius: "5px",
                        color: "#a29bfe",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = "#a29bfe"; e.currentTarget.style.color = "#0a0912"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a29bfe"; }}
                    >
                      Retrieve
                    </button>
                    <button
                      onClick={() => nav("/sequenceviewer", { state: { file_id: r.file_id, filename: r.filename } })}
                      style={{
                        padding: "6px 14px",
                        background: "transparent",
                        border: "1px solid #48dbfb44",
                        borderRadius: "5px",
                        color: "#48dbfb",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = "#48dbfb"; e.currentTarget.style.color = "#0a0912"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#48dbfb"; }}
                    >
                      View sequence
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty initial state */}
        {!hasSearched && !loading && (
          <div className="card" style={{ textAlign: "center", padding: "40px 20px", color: "#6b5f8a" }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>🔍</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#9a8fc0" }}>
              Type above to search your vault
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;
