import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getUserFiles, deleteFile, analyzeConstraints, verifyFile, extractError } from "../services/api";
import DNAConstraintsPanel from "../components/DNAConstraintsPanel";
import { downloadConstraintsReport } from "../utils/downloadReport";

function ViewFiles() {
  const nav = useNavigate();
  const [files, setFiles] = useState([]);
  const [delId, setDelId] = useState(null);
  const [error, setError] = useState("");

  // Constraints panel state
  const [cFileId, setCFileId] = useState(null);
  const [cData, setCData] = useState(null);
  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError] = useState("");

  // Verification state
  const [vFileId, setVFileId] = useState(null);
  const [vData, setVData] = useState(null);
  const [vLoading, setVLoading] = useState(false);
  const [vError, setVError] = useState("");

  useEffect(() => { getUserFiles().then(r => setFiles(r.data.files)).catch(e => setError(extractError(e, "Failed to load"))); }, []);

  const doDel = async (fid) => {
    if (!window.confirm("Delete this file permanently?")) return;
    setDelId(fid);
    try {
      await deleteFile(fid);
      setTimeout(() => {
        setFiles(p => p.filter(f => f.file_id !== fid));
        setDelId(null);
        if (cFileId === fid) { setCFileId(null); setCData(null); }
        if (vFileId === fid) { setVFileId(null); setVData(null); }
      }, 300);
    } catch (e) { alert(`Delete failed: ${extractError(e)}`); setDelId(null); }
  };

  const doConstraints = async (fid) => {
    if (cFileId === fid) { setCFileId(null); setCData(null); setCError(""); return; }
    setCFileId(fid); setVFileId(null); setCData(null); setCError(""); setCLoading(true);
    try { const res = await analyzeConstraints(fid); setCData(res.data); }
    catch (e) { setCError(extractError(e, "Analysis failed")); }
    setCLoading(false);
  };

  const doVerify = async (fid) => {
    if (vFileId === fid) { setVFileId(null); setVData(null); setVError(""); return; }
    setVFileId(fid); setCFileId(null); setVData(null); setVError(""); setVLoading(true);
    try { const res = await verifyFile(fid); setVData(res.data); }
    catch (e) { setVError(extractError(e, "Verification failed")); }
    setVLoading(false);
  };

  const getFilename = (fid) => {
    const f = files.find(x => x.file_id === fid);
    return f ? f.filename : fid;
  };

  const acts = (f) => [
    { label: "Retrieve", color: "#48dbfb", fn: () => nav("/retrieve", { state: { fileId: f.file_id } }) },
    { label: "Sequence", color: "#a29bfe", fn: () => nav("/sequence", { state: { fileId: f.file_id, filename: f.filename } }) },
    { label: "Constraints", color: "#22c55e", fn: () => doConstraints(f.file_id) },
    { label: "Verify", color: "#f0932b", fn: () => doVerify(f.file_id) },
    { label: "Delete", color: "#ef4444", fn: () => doDel(f.file_id) },
  ];

  const activeLabel = (fid, label) => (label === "Constraints" && cFileId === fid) || (label === "Verify" && vFileId === fid);

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
            {files.map((f, i) => {
              const isPanelOpen = cFileId === f.file_id || vFileId === f.file_id;
              return (
                <div key={f.file_id}>
                  <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 1fr 100px auto", gap: "14px", padding: "12px 18px", borderBottom: (i < files.length - 1 && !isPanelOpen) ? "1px solid #2a2440" : "none", alignItems: "center", opacity: delId === f.file_id ? 0 : 1, transition: "opacity 0.3s,background 0.15s" }}
                    onMouseOver={e => e.currentTarget.style.background = "#16132a"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ fontSize: "13px", color: "#9a8fc0", fontWeight: "600" }}>{i + 1}</div>
                    <div style={{ fontSize: "12px", color: "#c4b5fd", fontFamily: "var(--font-mono)", wordBreak: "break-all", fontWeight: "500" }}>{f.file_id}</div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#f0ecf8" }}>{f.filename}</div>
                    <span style={{ padding: "3px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600", background: f.encoding_type === "6base" ? "#1a1210" : "#1a1528", color: f.encoding_type === "6base" ? "#f0932b" : "#a29bfe", display: "inline-block", width: "fit-content" }}>
                      {f.encoding_type === "6base" ? "6-Base" : "4-Base"}
                    </span>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {acts(f).map(a => {
                        const active = activeLabel(f.file_id, a.label);
                        return (
                          <button key={a.label} onClick={a.fn} style={{
                            padding: "5px 10px", background: active ? a.color : "transparent",
                            border: `1px solid ${a.color}44`, borderRadius: "5px",
                            color: active ? "#fff" : a.color,
                            fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s"
                          }}
                            onMouseOver={e => { e.currentTarget.style.background = a.color; e.currentTarget.style.color = "#fff"; }}
                            onMouseOut={e => {
                              if (active) { e.currentTarget.style.background = a.color; e.currentTarget.style.color = "#fff"; }
                              else { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = a.color; }
                            }}>
                            {a.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Constraints panel */}
                  {cFileId === f.file_id && (
                    <div style={{ padding: "16px 18px", borderBottom: i < files.length - 1 ? "1px solid #2a2440" : "none", background: "#0e0c18" }}>
                      {cLoading && (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 0" }}>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #2a2440", borderTopColor: "#22c55e", animation: "spin 0.8s linear infinite" }} />
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#22c55e" }}>Analyzing DNA constraints...</span>
                        </div>
                      )}
                      {cError && <div style={{ fontSize: "13px", fontWeight: "600", color: "#ef4444", padding: "8px 12px", background: "#1a0a0a", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)" }}>{cError}</div>}
                      {cData && (
                        <div>
                          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                            <button onClick={() => downloadConstraintsReport(cData, getFilename(f.file_id))}
                              style={{ padding: "6px 14px", background: "transparent", border: "1px solid #48dbfb44", borderRadius: "5px", color: "#48dbfb", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s" }}
                              onMouseOver={e => { e.currentTarget.style.background = "#48dbfb"; e.currentTarget.style.color = "#fff"; }}
                              onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#48dbfb"; }}>
                              ↓ Download Report
                            </button>
                          </div>
                          <DNAConstraintsPanel data={cData} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verification panel */}
                  {vFileId === f.file_id && (
                    <div style={{ padding: "16px 18px", borderBottom: i < files.length - 1 ? "1px solid #2a2440" : "none", background: "#0e0c18" }}>
                      {vLoading && (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 0" }}>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #2a2440", borderTopColor: "#f0932b", animation: "spin 0.8s linear infinite" }} />
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#f0932b" }}>Verifying data integrity (full decode round-trip)...</span>
                        </div>
                      )}
                      {vError && <div style={{ fontSize: "13px", fontWeight: "600", color: "#ef4444", padding: "8px 12px", background: "#1a0a0a", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)" }}>{vError}</div>}
                      {vData && (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", padding: "14px", borderRadius: "8px", background: vData.overall_pass ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${vData.overall_pass ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                            <div>
                              <div style={{ fontSize: "18px", fontWeight: "800", color: vData.overall_pass ? "#22c55e" : "#ef4444", marginBottom: "4px", letterSpacing: "1px" }}>
                                {vData.overall_pass ? "✓ VERIFIED" : "✗ FAILED"}
                              </div>
                              <div style={{ fontSize: "13px", color: "#9a8fc0", fontWeight: "500" }}>
                                Data integrity check complete
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "11px", color: "#9a8fc0", fontWeight: "600", marginBottom: "2px" }}>ORIGINAL SIZE</div>
                              <div style={{ fontSize: "14px", fontWeight: "700", color: "#f0ecf8", fontFamily: "var(--font-mono)" }}>{vData.original_size?.toLocaleString()} bytes</div>
                            </div>
                          </div>

                          <div style={{ display: "grid", gap: "10px" }}>
                            {Object.entries(vData.checks || {}).map(([key, check]) => (
                              <div key={key} style={{ padding: "12px 14px", background: "#12101e", border: `1px solid ${check.pass ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: "6px", borderLeft: `3px solid ${check.pass ? "#22c55e" : "#ef4444"}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ecf8", textTransform: "capitalize" }}>
                                    {key.replace(/_/g, " ")}
                                  </div>
                                  <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", background: check.pass ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: check.pass ? "#22c55e" : "#ef4444" }}>
                                    {check.pass ? "PASS" : "FAIL"}
                                  </span>
                                </div>
                                <div style={{ fontSize: "12px", color: "#9a8fc0", fontWeight: "500", marginBottom: "6px" }}>{check.description}</div>
                                <div style={{ fontSize: "11px", color: "#6b5f8a", fontFamily: "var(--font-mono)", fontWeight: "500" }}>
                                  {check.valid !== undefined && <span>Valid: {check.valid} · Invalid: {check.invalid}  </span>}
                                  {check.merkle_root && <span>Merkle: {check.merkle_root}  </span>}
                                  {check.decoded_size !== undefined && <span>Decoded: {check.decoded_size} bytes · Match: {check.size_match ? "✓" : "✗"}  </span>}
                                  {check.decoded_hash && <span>Hash: {check.decoded_hash}  </span>}
                                  {check.error && <span style={{ color: "#ef4444" }}>Error: {check.error}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
export default ViewFiles;
