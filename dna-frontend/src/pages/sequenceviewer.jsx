import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getSequence } from "../services/api";

const FORWARD_PRIMER = "ACGTACGTAC";
const REVERSE_PRIMER = "TGCATGCATG";

const parseFragment = (raw, idx) => {
  try {
    const [chunkPart, rest] = raw.split(":", 2);
    const [indexPart, dna] = rest.split("|", 2);
    const onlyDNA = dna.replace(new RegExp(`^${FORWARD_PRIMER}`), "").replace(new RegExp(`${REVERSE_PRIMER}$`), "");
    return { raw, idx, chunkId: parseInt(chunkPart), fragIndex: parseInt(indexPart), forwardPrimer: FORWARD_PRIMER, coreDNA: onlyDNA, reversePrimer: REVERSE_PRIMER, fullDNA: dna, length: dna.length };
  } catch { return null; }
};

const copyToClipboard = (text) => navigator.clipboard.writeText(text).then(() => alert("Copied!"));
const downloadText = (text, filename) => { const b = new Blob([text], { type: "text/plain" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = filename; a.click(); URL.revokeObjectURL(u); };

function ColoredDNA({ forward, core, reverse }) {
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", wordBreak: "break-all", lineHeight: "2" }}>
      <span style={{ color: "#d97706", background: "#fef3c7", borderRadius: "2px", padding: "0 1px" }}>{forward}</span>
      <span style={{ color: "#16a34a" }}>{core}</span>
      <span style={{ color: "#dc2626", background: "#fee2e2", borderRadius: "2px", padding: "0 1px" }}>{reverse}</span>
    </span>
  );
}

function SequenceViewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { fileId, filename } = location.state || {};
  const [status, setStatus] = useState("idle");
  const [view, setView] = useState("full");
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
      setParsedFragments(parsed); setTotalFragments(total_fragments);
      setFullSequence(parsed.map((f) => f.fullDNA).join(""));
      setStatus("done");
    } catch { setStatus("error"); }
  };

  const filteredFragments = parsedFragments.filter((f) => search === "" || f.fragIndex.toString().includes(search) || f.chunkId.toString().includes(search) || f.fullDNA.includes(search.toUpperCase()));

  const btn = (color) => ({ padding: "7px 14px", background: color, border: "none", borderRadius: "6px", color: "#fff", fontWeight: "600", cursor: "pointer", fontSize: "12px" });
  const outlineBtn = (active) => ({ padding: "7px 16px", background: active ? "#2563eb" : "transparent", border: `1px solid ${active ? "#2563eb" : "#e2e8f0"}`, borderRadius: "6px", color: active ? "#fff" : "#64748b", cursor: "pointer", fontSize: "13px", fontWeight: "500" });

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <button onClick={() => navigate("/files")} style={{ background: "transparent", border: "1px solid #e2e8f0", color: "#64748b", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", marginBottom: "20px" }}>← Back to Files</button>

        <div className="page-title">DNA Sequence Viewer</div>
        <div className="page-subtitle">{filename || fileId} · Binary → Compress → Hex → Reed-Solomon → DNA</div>

        {status === "idle" && (
          <div className="card">
            <div style={{ color: "#64748b", marginBottom: "14px", fontSize: "14px" }}>Load the exact DNA fragments stored in the database.</div>
            <button style={btn("#2563eb")} onClick={handleFetch}>Load DNA Sequence</button>
          </div>
        )}

        {status === "loading" && <div className="card" style={{ color: "#2563eb", fontSize: "14px" }}>Fetching fragments...</div>}
        {status === "error" && <div className="card" style={{ color: "#ef4444" }}>Failed to load sequence. Check if you are logged in.</div>}

        {status === "done" && (
          <>
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
              {[{ label: "Total Fragments", value: totalFragments }, { label: "Total DNA Bases", value: fullSequence.length.toLocaleString() }, { label: "Encoding", value: "2-BIT" }, { label: "Error Correction", value: "Reed-Solomon" }].map((s) => (
                <div key={s.label} className="card" style={{ textAlign: "center", padding: "12px 20px", flex: 1, minWidth: "140px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: "#2563eb", marginTop: "4px" }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <button style={outlineBtn(view === "full")} onClick={() => setView("full")}>Full Sequence</button>
              <button style={outlineBtn(view === "fragments")} onClick={() => setView("fragments")}>Fragmented View ({totalFragments})</button>
            </div>

            {view === "full" && (
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>Complete DNA sequence · {fullSequence.length.toLocaleString()} bases</div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button style={btn("#2563eb")} onClick={() => copyToClipboard(fullSequence)}>Copy</button>
                    <button style={btn("#7c3aed")} onClick={() => downloadText(fullSequence, `${filename || fileId}_sequence.txt`)}>Download .txt</button>
                    <button style={btn("#059669")} onClick={() => downloadText(fullSequence, `${filename || fileId}_sequence.fasta`)}>Download .fasta</button>
                  </div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", maxHeight: "320px", overflowY: "auto", wordBreak: "break-all", fontSize: "12px", lineHeight: "2", color: "#16a34a", fontFamily: "var(--font-mono)" }}>{fullSequence}</div>
              </div>
            )}

            {view === "fragments" && (
              <div className="card">
                <div style={{ display: "flex", gap: "12px", marginBottom: "14px", fontSize: "12px", alignItems: "center" }}>
                  <span style={{ padding: "2px 8px", borderRadius: "4px", background: "#fef3c7", color: "#d97706", fontWeight: "600" }}>Forward Primer</span>
                  <span style={{ padding: "2px 8px", borderRadius: "4px", background: "#dcfce7", color: "#16a34a", fontWeight: "600" }}>Core DNA</span>
                  <span style={{ padding: "2px 8px", borderRadius: "4px", background: "#fee2e2", color: "#dc2626", fontWeight: "600" }}>Reverse Primer</span>
                </div>
                <div style={{ marginBottom: "14px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <input style={{ padding: "8px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", color: "#0f172a", fontSize: "13px", width: "260px" }} placeholder="Search by chunk, index, or sequence..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Showing {filteredFragments.length} / {totalFragments}</span>
                  <button style={btn("#2563eb")} onClick={() => downloadText(parsedFragments.map((f) => f.raw).join("\n"), `${filename || fileId}_fragments.txt`)}>Download All</button>
                </div>
                <div style={{ maxHeight: "520px", overflowY: "auto" }}>
                  {filteredFragments.map((f) => (
                    <div key={f.idx} onClick={() => setExpandedIdx(expandedIdx === f.idx ? null : f.idx)}
                      style={{ background: expandedIdx === f.idx ? "#f8fafc" : "#fff", border: `1px solid ${expandedIdx === f.idx ? "#2563eb30" : "#e2e8f0"}`, borderRadius: "8px", padding: "12px 16px", marginBottom: "6px", cursor: "pointer", transition: "all 0.15s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", background: "#eff6ff", color: "#2563eb", fontWeight: "600" }}>Chunk {f.chunkId}</span>
                          <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", background: "#f5f3ff", color: "#7c3aed", fontWeight: "600" }}>Index {f.fragIndex}</span>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{f.length} bases</span>
                        </div>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{expandedIdx === f.idx ? "▲" : "▼"}</span>
                      </div>
                      {expandedIdx !== f.idx && <div style={{ marginTop: "6px", fontSize: "12px", color: "#94a3b8", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontFamily: "var(--font-mono)" }}>{f.fullDNA.slice(0, 80)}...</div>}
                      {expandedIdx === f.idx && (
                        <div style={{ marginTop: "12px" }}>
                          <div style={{ marginBottom: "10px" }}><ColoredDNA forward={f.forwardPrimer} core={f.coreDNA} reverse={f.reversePrimer} /></div>
                          <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                            <button style={btn("#2563eb")} onClick={(e) => { e.stopPropagation(); copyToClipboard(f.fullDNA); }}>Copy Fragment</button>
                            <button style={btn("#7c3aed")} onClick={(e) => { e.stopPropagation(); copyToClipboard(f.coreDNA); }}>Copy Core</button>
                            <button style={btn("#059669")} onClick={(e) => { e.stopPropagation(); downloadText(`>chunk${f.chunkId}_frag${f.fragIndex}\n${f.fullDNA}`, `chunk${f.chunkId}_frag${f.fragIndex}.fasta`); }}>.fasta</button>
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
