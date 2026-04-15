import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getUserFiles, deleteFile, analyzeConstraints, extractError } from "../services/api";
import DNAConstraintsPanel from "../components/DNAConstraintsPanel";

function ViewFiles() {
  const nav = useNavigate();
  const [files, setFiles] = useState([]);
  const [delId, setDelId] = useState(null);
  const [error, setError] = useState("");
  const [cFileId, setCFileId] = useState(null);
  const [cData, setCData] = useState(null);
  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError] = useState("");

  useEffect(() => { getUserFiles().then(r => setFiles(r.data.files)).catch(e => setError(extractError(e, "Failed to load"))); }, []);

  const doDel = async (fid) => {
    if (!window.confirm("Delete this file permanently?")) return;
    setDelId(fid);
    try { await deleteFile(fid); setTimeout(() => { setFiles(p => p.filter(f => f.file_id !== fid)); setDelId(null); if (cFileId === fid) { setCFileId(null); setCData(null); } }, 300); }
    catch (e) { alert(`Delete failed: ${extractError(e)}`); setDelId(null); }
  };

  const doConstraints = async (fid) => {
    if (cFileId === fid) { setCFileId(null); setCData(null); setCError(""); return; }
    setCFileId(fid); setCData(null); setCError(""); setCLoading(true);
    try {
      const res = await analyzeConstraints(fid);
      setCData(res.data);
    } catch (e) {
      setCError(extractError(e, "Analysis failed"));
    }
    setCLoading(false);
  };

  const acts = (f) => [
    { label: "Retrieve", color: "#48dbfb", fn: () => nav("/retrieve", { state: { fileId: f.file_id } }) },
    { label: "Sequence", color: "#a29bfe", fn: () => nav("/sequence", { state: { fileId: f.file_id, filename: f.filename } }) },
    { label: "Constraints", color: "#22c55e", fn: () => doConstraints(f.file_id) },
    { label: "Delete", color: "#ef4444", fn: () => doDel(f.file_id) },
  ];

  return (
    <div className="page-layout"><Sidebar />
      <div className="page-content">
        <div className="page-title">My Files</div>
        <div className="page-subtitle">{files.length} file{files.length !== 1 ? "s" : ""} stored in DNA Vault</div>

        {error && <div style={{ fontSize: "13px", fontWeight: "600", color: "#ef4444", marginBottom: "14px", padding: "10px 14px", background: "#1a0a0a", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)" }}>{error}</div>}

        {files.length === 0 && !error ? (
          <div className="card" style={{ textAlign: "center", padding: "44px" }}>
            <div style={{ color: "#9a8fc0", fontSize: "14px", fontWeight: "600" }}>No files stored yet</div>
            <button className="btn-primary" style={{ marginTop: "16px" }} onClick={() => nav("/upload")}>Upload first file</button>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 1fr 100px auto", gap: "14px", padding: "10px 18px", borderBottom: "1px solid #2a2440", background: "#0e0c18" }}>
              {["#", "File ID", "Filename", "Encoding", "Actions"].map(h => <div key={h} style={{ fontSize: "11px", color: "#9a8fc0", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700" }}>{h}</div>)}
            </div>
            {files.map((f, i) => (
              <div key={f.file_id}>
                <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 1fr 100px auto", gap: "14px", padding: "12px 18px", borderBottom: (i < files.length - 1 && cFileId !== f.file_id) ? "1px solid #2a2440" : "none", alignItems: "center", opacity: delId === f.file_id ? 0 : 1, transition: "opacity 0.3s,background 0.15s" }}
                  onMouseOver={e => e.currentTarget.style.background = "#16132a"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ fontSize: "13px", color: "#9a8fc0", fontWeight: "600" }}>{i + 1}</div>
                  <div style={{ fontSize: "12px", color: "#c4b5fd", fontFamily: "var(--font-mono)", wordBreak: "break-all", fontWeight: "500" }}>{f.file_id}</div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#f0ecf8" }}>{f.filename}</div>
                  <span style={{ padding: "3px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600", background: f.encoding_type === "6base" ? "#1a1210" : "#1a1528", color: f.encoding_type === "6base" ? "#f0932b" : "#a29bfe", display: "inline-block", width: "fit-content" }}>
                    {f.encoding_type === "6base" ? "6-Base" : "4-Base"}
                  </span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {acts(f).map(a => (
                      <button key={a.label} onClick={a.fn} style={{
                        padding: "5px 10px", background: (a.label === "Constraints" && cFileId === f.file_id) ? a.color : "transparent",
                        border: `1px solid ${a.color}44`, borderRadius: "5px",
                        color: (a.label === "Constraints" && cFileId === f.file_id) ? "#fff" : a.color,
                        fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s"
                      }}
                        onMouseOver={e => { e.target.style.background = a.color; e.target.style.color = "#fff"; }}
                        onMouseOut={e => {
                          if (a.label === "Constraints" && cFileId === f.file_id) { e.target.style.background = a.color; e.target.style.color = "#fff"; }
                          else { e.target.style.background = "transparent"; e.target.style.color = a.color; }
                        }}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Constraints panel — shows below the file row */}
                {cFileId === f.file_id && (
                  <div style={{ padding: "16px 18px", borderBottom: i < files.length - 1 ? "1px solid #2a2440" : "none", background: "#0e0c18" }}>
                    {cLoading && (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 0" }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #2a2440", borderTopColor: "#22c55e", animation: "spin 0.8s linear infinite" }} />
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#22c55e" }}>Analyzing DNA constraints...</span>
                      </div>
                    )}
                    {cError && (
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#ef4444", padding: "8px 12px", background: "#1a0a0a", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)" }}>{cError}</div>
                    )}
                    {cData && <DNAConstraintsPanel data={cData} />}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default ViewFiles;
