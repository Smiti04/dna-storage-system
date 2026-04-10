import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { uploadFile, analyzeConstraints } from "../services/api";
import DNAConstraintsPanel from "../components/DNAConstraintsPanel";

function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [encodingType, setEncodingType] = useState("4base");
  const [status, setStatus] = useState("idle");
  const [log, setLog] = useState([]);
  const [result, setResult] = useState(null);
  const [constraintData, setConstraintData] = useState(null);
  const [analyzingConstraints, setAnalyzingConstraints] = useState(false);
  const inputRef = useRef();

  const addLog = (msg) => setLog((prev) => [...prev, msg]);

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading"); setLog([]); setConstraintData(null); setResult(null);
    addLog(`Preparing: ${file.name}`);
    addLog(`Encoding: ${encodingType === "6base" ? "6-Base Epigenetic" : "4-Base Standard"}`);
    addLog("Compressing data...");

    try {
      const res = await uploadFile(file, encodingType, (msg) => addLog(msg));
      if (res.data.success) {
        addLog("Reed-Solomon encoding applied...");
        addLog(`DNA sequence generated (${encodingType})...`);
        addLog("Stored to blockchain...");
        addLog("✓ Upload complete");
        setResult(res.data); setStatus("done");

        const keyContent = [`FILE ID: ${res.data.file_id}`, `RETRIEVAL KEY: ${res.data.retrieval_key}`, `MERKLE ROOT: ${res.data.merkle_root}`, `ENCODING: ${res.data.encoding_type}`].join("\n");
        const blob = new Blob([keyContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `${file.name}_key.txt`; a.click(); URL.revokeObjectURL(url);

        addLog("Analyzing DNA constraints...");
        setAnalyzingConstraints(true);
        try { const r = await analyzeConstraints(res.data.file_id); setConstraintData(r.data); addLog("✓ Constraint analysis complete"); } catch { addLog("⚠ Constraint analysis failed"); }
        setAnalyzingConstraints(false);
      } else { addLog(`✗ Error: ${res.data.error}`); setStatus("error"); }
    } catch { addLog("✗ Upload failed"); setStatus("error"); }
  };

  const encodings = [
    { id: "4base", label: "4-Base Standard", bases: "A · T · G · C", badge: "Ready now", badgeColor: "#16a34a", badgeBg: "#f0fdf4", desc: "Standard DNA bases. Compatible with all sequencing platforms.", density: "2.0 bits/base", compat: "All platforms" },
    { id: "6base", label: "6-Base Epigenetic", bases: "A · T · G · C · 5mC · 6mA", badge: "Future-ready", badgeColor: "#2563eb", badgeBg: "#eff6ff", desc: "Adds epigenetic bases for +29% data density. Requires Nanopore sequencing.", density: "2.58 bits/base", compat: "Nanopore only" },
  ];

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">Upload File</div>
        <div className="page-subtitle">Select encoding, drop a file, then encode & store</div>

        {/* Step 1 */}
        <div style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", letterSpacing: "0.5px", marginBottom: "12px", textTransform: "uppercase" }}>Step 1 — Encoding mode</div>
        <div style={{ display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
          {encodings.map((enc) => (
            <div key={enc.id} onClick={() => setEncodingType(enc.id)}
              style={{ flex: 1, minWidth: "260px", padding: "20px", background: "#fff", border: `1.5px solid ${encodingType === enc.id ? enc.badgeColor : "#e2e8f0"}`, borderRadius: "10px", cursor: "pointer", transition: "all 0.15s", boxShadow: encodingType === enc.id ? `0 0 0 3px ${enc.badgeColor}15` : "var(--shadow-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a", marginBottom: "4px" }}>{enc.label}</div>
                  <div style={{ fontSize: "13px", color: "#64748b", fontFamily: "var(--font-mono)" }}>{enc.bases}</div>
                </div>
                <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "600", background: enc.badgeBg, color: enc.badgeColor }}>{enc.badge}</span>
              </div>
              <div style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.6", marginBottom: "12px" }}>{enc.desc}</div>
              <div style={{ display: "flex", gap: "20px", fontSize: "12px", color: "#94a3b8" }}>
                <span><strong style={{ color: "#475569" }}>Density:</strong> {enc.density}</span>
                <span><strong style={{ color: "#475569" }}>Platform:</strong> {enc.compat}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Step 2 — Drop zone */}
        <div style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", letterSpacing: "0.5px", marginBottom: "12px", textTransform: "uppercase" }}>Step 2 — Select file</div>
        <div
          onClick={() => inputRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0]); }}
          style={{ border: `2px dashed ${dragging ? "#2563eb" : file ? "#22c55e" : "#e2e8f0"}`, borderRadius: "10px", padding: "40px", textAlign: "center", cursor: "pointer", background: dragging ? "#eff6ff" : file ? "#f0fdf4" : "#fff", transition: "all 0.15s", marginBottom: "20px" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px", color: file ? "#16a34a" : "#94a3b8" }}>{file ? "✓" : "↑"}</div>
          <div style={{ fontSize: "14px", fontWeight: "500", color: file ? "#16a34a" : "#64748b" }}>{file ? file.name : "Drop file here or click to browse"}</div>
          {file && <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>{(file.size / 1024).toFixed(1)} KB</div>}
          <input ref={inputRef} type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0])} />
        </div>

        {/* Pre-upload summary */}
        {file && (
          <div className="card" style={{ marginBottom: "20px", display: "flex", gap: "32px", flexWrap: "wrap" }}>
            {[["File", file.name], ["Size", `${(file.size / 1024).toFixed(1)} KB`], ["Encoding", encodingType === "6base" ? "6-Base Epigenetic" : "4-Base Standard"], ["Bases", encodingType === "6base" ? "A T G C 5mC 6mA" : "A T G C"]].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{k}</div>
                <div style={{ fontSize: "14px", fontWeight: "500", color: "#0f172a" }}>{v}</div>
              </div>
            ))}
          </div>
        )}

        {/* Step 3 */}
        <div style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", letterSpacing: "0.5px", marginBottom: "12px", textTransform: "uppercase" }}>Step 3 — Encode & store</div>
        <button className="btn-primary" onClick={handleUpload} disabled={!file || status === "uploading"} style={{ marginBottom: "24px" }}>
          {status === "uploading" ? "Encoding..." : "Encode & Store"}
        </button>

        {/* Process log */}
        {log.length > 0 && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", letterSpacing: "0.5px", marginBottom: "12px", textTransform: "uppercase" }}>Process log</div>
            {log.map((l, i) => (
              <div key={i} style={{ fontSize: "13px", padding: "3px 0", fontFamily: "var(--font-mono)", color: l.startsWith("✓") ? "#16a34a" : l.startsWith("✗") ? "#ef4444" : l.startsWith("⚠") ? "#f59e0b" : "#64748b" }}>▸ {l}</div>
            ))}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="card" style={{ border: "1px solid #dcfce7", background: "#fafffe", marginBottom: "8px" }}>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#16a34a", marginBottom: "16px" }}>✓ Storage Complete</div>
            {[["File ID", result.file_id], ["Encoding", result.encoding_type === "6base" ? "6-Base Epigenetic" : "4-Base Standard"], ["Merkle Root", result.merkle_root]].map(([k, v]) => (
              <div key={k} style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>{k}</div>
                <div style={{ fontSize: "13px", color: "#0f172a", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>{v}</div>
              </div>
            ))}
            <div style={{ fontSize: "13px", color: "#16a34a", marginTop: "8px" }}>✓ Retrieval key downloaded automatically</div>
            <button className="btn-primary" style={{ marginTop: "16px" }} onClick={() => navigate("/files")}>View my files</button>
          </div>
        )}

        {analyzingConstraints && <div className="card" style={{ marginTop: "20px", fontSize: "14px", color: "#2563eb" }}>Analyzing DNA constraints...</div>}
        {constraintData && <DNAConstraintsPanel data={constraintData} />}
      </div>
    </div>
  );
}

export default Upload;
