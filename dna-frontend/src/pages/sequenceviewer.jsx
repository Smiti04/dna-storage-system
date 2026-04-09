import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getSequence } from "../services/api";

const FORWARD_PRIMER = "ACGTACGTAC";
const REVERSE_PRIMER = "TGCATGCATG";

// Parse "0:00000001|ACGT..." into parts
const parseFragment = (raw, idx) => {
  try {
    const [chunkPart, rest] = raw.split(":", 2);
    const [indexPart, dna] = rest.split("|", 2);
    const onlyDNA = dna
      .replace(new RegExp(`^${FORWARD_PRIMER}`), "")
      .replace(new RegExp(`${REVERSE_PRIMER}$`), "");
    return {
      raw,
      idx,
      chunkId: parseInt(chunkPart),
      fragIndex: parseInt(indexPart),
      forwardPrimer: FORWARD_PRIMER,
      coreDNA: onlyDNA,
      reversePrimer: REVERSE_PRIMER,
      fullDNA: dna,
      length: dna.length,
    };
  } catch {
    return null;
  }
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => alert("Copied to clipboard!"));
};

const downloadText = (text, filename) => {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Color each part of a fragment differently
function ColoredDNA({ forward, core, reverse }) {
  return (
    <span style={{ fontFamily: "monospace", fontSize: "13px", wordBreak: "break-all" }}>
      <span style={{ color: "#f59e0b", backgroundColor: "#1c1408" }}>{forward}</span>
      <span style={{ color: "#4ade80" }}>{core}</span>
      <span style={{ color: "#f87171", backgroundColor: "#1c0a0a" }}>{reverse}</span>
    </span>
  );
}

function SequenceViewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { fileId, filename } = location.state || {};

  const [status, setStatus] = useState("idle");
  const [view, setView] = useState("full"); // "full" | "fragments"
  const [parsedFragments, setParsedFragments] = useState([]);
  const [fullSequence, setFullSequence] = useState("");
  const [totalFragments, setTotalFragments] = useState(0);
  const [search, setSearch] = useState("");
  const [expandedIdx, setExpandedIdx] = useState(null);

  const handleFetch = async () => {
    setStatus("loading");
    try {
      const res = await getSequence(fileId);
      const { fragments, total_fragments } = res.data;

      const parsed = fragments.map((f, i) => parseFragment(f, i)).filter(Boolean);
      setParsedFragments(parsed);
      setTotalFragments(total_fragments);

      // Full sequence = all DNA parts joined (with primers)
      const full = parsed.map((f) => f.fullDNA).join("");
      setFullSequence(full);

      setStatus("done");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  const filteredFragments = parsedFragments.filter(
    (f) =>
      search === "" ||
      f.fragIndex.toString().includes(search) ||
      f.chunkId.toString().includes(search) ||
      f.fullDNA.includes(search.toUpperCase())
  );

  const s = {
    page: { display: "flex", minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'Courier New', monospace" },
    main: { padding: "28px 32px", width: "100%", overflowX: "hidden" },
    title: { fontSize: "26px", fontWeight: "bold", color: "#38bdf8", letterSpacing: "3px", marginBottom: "4px" },
    sub: { color: "#475569", fontSize: "12px", marginBottom: "24px" },
    card: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", padding: "20px", marginBottom: "20px" },
    btn: (bg) => ({ padding: "9px 18px", background: bg, border: "none", borderRadius: "6px", color: "#fff", fontWeight: "bold", cursor: "pointer", fontSize: "12px", letterSpacing: "1px" }),
    outlineBtn: (active) => ({ padding: "8px 16px", background: active ? "#0ea5e9" : "transparent", border: `1px solid ${active ? "#0ea5e9" : "#1e293b"}`, borderRadius: "6px", color: active ? "#fff" : "#64748b", cursor: "pointer", fontSize: "12px", fontFamily: "monospace" }),
    tag: (bg, color) => ({ display: "inline-block", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", background: bg, color, marginRight: "6px", fontWeight: "bold" }),
    seqBox: { background: "#020817", border: "1px solid #1e293b", borderRadius: "6px", padding: "16px", maxHeight: "320px", overflowY: "auto", wordBreak: "break-all", fontSize: "13px", lineHeight: "2", color: "#4ade80" },
    fragCard: (expanded) => ({ background: expanded ? "#0f1e35" : "#080d1a", border: `1px solid ${expanded ? "#0ea5e9" : "#1e293b"}`, borderRadius: "8px", padding: "14px", marginBottom: "10px", cursor: "pointer", transition: "all 0.2s" }),
    input: { padding: "8px 12px", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", color: "#e2e8f0", fontFamily: "monospace", fontSize: "13px", width: "260px" },
    backBtn: { background: "transparent", border: "1px solid #1e293b", color: "#475569", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", marginBottom: "20px" },
    legend: { display: "flex", gap: "16px", marginBottom: "12px", fontSize: "12px", alignItems: "center" },
    stat: { textAlign: "center", padding: "12px 20px", background: "#080d1a", border: "1px solid #1e293b", borderRadius: "8px" },
  };

  return (
    <div style={s.page}>
      <Sidebar />
      <div style={s.main}>
        <button style={s.backBtn} onClick={() => navigate("/files")}>← Back to Files</button>

        <div style={s.title}>🧬 DNA SEQUENCE VIEWER</div>
        <div style={s.sub}>
          {filename || fileId} &nbsp;·&nbsp; Binary → Compress → Hex → Reed-Solomon → DNA Encoding
        </div>

        {/* Fetch button */}
        {status === "idle" && (
          <div style={s.card}>
            <div style={{ color: "#64748b", marginBottom: "14px", fontSize: "13px" }}>
              This will load the exact DNA fragments stored in the database — the same sequences
              used for physical DNA synthesis via NGS / Nanopore sequencing.
            </div>
            <button style={s.btn("#059669")} onClick={handleFetch}>
              ⚡ Load DNA Sequence
            </button>
          </div>
        )}

        {status === "loading" && (
          <div style={{ ...s.card, color: "#38bdf8", fontSize: "14px" }}>
            ⏳ Fetching fragments from database...
          </div>
        )}

        {status === "error" && (
          <div style={{ ...s.card, color: "#f87171" }}>
            ❌ Failed to load sequence. Check if you are logged in and the file exists.
          </div>
        )}

        {status === "done" && (
          <>
            {/* Stats row */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
              {[
                { label: "TOTAL FRAGMENTS", value: totalFragments },
                { label: "TOTAL DNA BASES", value: fullSequence.length.toLocaleString() },
                { label: "ENCODING", value: "2-BIT" },
                { label: "ERROR CORRECTION", value: "REED-SOLOMON" },
              ].map((stat) => (
                <div key={stat.label} style={s.stat}>
                  <div style={{ fontSize: "11px", color: "#475569", letterSpacing: "1px" }}>{stat.label}</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#38bdf8", marginTop: "4px" }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* View toggle */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button style={s.outlineBtn(view === "full")} onClick={() => setView("full")}>
                Full Sequence
              </button>
              <button style={s.outlineBtn(view === "fragments")} onClick={() => setView("fragments")}>
                Fragmented View ({totalFragments})
              </button>
            </div>

            {/* FULL SEQUENCE VIEW */}
            {view === "full" && (
              <div style={s.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>
                    Complete DNA sequence · {fullSequence.length.toLocaleString()} bases
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button style={s.btn("#0ea5e9")} onClick={() => copyToClipboard(fullSequence)}>
                      📋 Copy
                    </button>
                    <button style={s.btn("#7c3aed")} onClick={() => downloadText(fullSequence, `${filename || fileId}_full_sequence.txt`)}>
                      ⬇ Download .txt
                    </button>
                    <button style={s.btn("#065f46")} onClick={() => downloadText(fullSequence, `${filename || fileId}_sequence.fasta`)}>
                      ⬇ Download .fasta
                    </button>
                  </div>
                </div>
                <div style={s.seqBox}>{fullSequence}</div>
                <div style={{ marginTop: "10px", fontSize: "11px", color: "#334155" }}>
                  💡 Use the .fasta file to submit directly to sequencing services (NGS / Nanopore)
                </div>
              </div>
            )}

            {/* FRAGMENTED VIEW */}
            {view === "fragments" && (
              <div style={s.card}>
                {/* Legend */}
                <div style={s.legend}>
                  <span>Legend:</span>
                  <span style={s.tag("#1c1408", "#f59e0b")}>▐ Forward Primer</span>
                  <span style={s.tag("#052e16", "#4ade80")}>▐ Core DNA</span>
                  <span style={s.tag("#1c0a0a", "#f87171")}>▐ Reverse Primer</span>
                </div>

                {/* Search */}
                <div style={{ marginBottom: "14px", display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    style={s.input}
                    placeholder="Search by chunk, index, or sequence..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <span style={{ fontSize: "12px", color: "#475569" }}>
                    Showing {filteredFragments.length} / {totalFragments}
                  </span>
                  <button
                    style={s.btn("#0ea5e9")}
                    onClick={() => {
                      const allRaw = parsedFragments.map((f) => f.raw).join("\n");
                      downloadText(allRaw, `${filename || fileId}_fragments.txt`);
                    }}
                  >
                    ⬇ Download All Fragments
                  </button>
                </div>

                {/* Fragment list */}
                <div style={{ maxHeight: "520px", overflowY: "auto" }}>
                  {filteredFragments.map((f) => (
                    <div
                      key={f.idx}
                      style={s.fragCard(expandedIdx === f.idx)}
                      onClick={() => setExpandedIdx(expandedIdx === f.idx ? null : f.idx)}
                    >
                      {/* Fragment header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={s.tag("#0c1a2e", "#38bdf8")}>CHUNK {f.chunkId}</span>
                          <span style={s.tag("#0c1a2e", "#818cf8")}>INDEX {f.fragIndex}</span>
                          <span style={{ fontSize: "12px", color: "#475569" }}>{f.length} bases</span>
                        </div>
                        <span style={{ fontSize: "11px", color: "#334155" }}>
                          {expandedIdx === f.idx ? "▲ collapse" : "▼ expand"}
                        </span>
                      </div>

                      {/* Collapsed preview */}
                      {expandedIdx !== f.idx && (
                        <div style={{ marginTop: "8px", fontSize: "12px", color: "#334155", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                          {f.fullDNA.slice(0, 80)}...
                        </div>
                      )}

                      {/* Expanded detail */}
                      {expandedIdx === f.idx && (
                        <div style={{ marginTop: "12px" }}>
                          <div style={{ marginBottom: "10px", lineHeight: "2" }}>
                            <ColoredDNA
                              forward={f.forwardPrimer}
                              core={f.coreDNA}
                              reverse={f.reversePrimer}
                            />
                          </div>
                          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                            <button
                              style={s.btn("#0ea5e9")}
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(f.fullDNA); }}
                            >
                              📋 Copy Fragment
                            </button>
                            <button
                              style={s.btn("#7c3aed")}
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(f.coreDNA); }}
                            >
                              📋 Copy Core Only
                            </button>
                            <button
                              style={s.btn("#065f46")}
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadText(
                                  `>chunk${f.chunkId}_frag${f.fragIndex}\n${f.fullDNA}`,
                                  `chunk${f.chunkId}_frag${f.fragIndex}.fasta`
                                );
                              }}
                            >
                              ⬇ .fasta
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SequenceViewer;