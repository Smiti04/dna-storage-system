import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { uploadFile, analyzeConstraints, extractError } from "../services/api";
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
  const [analyzing, setAnalyzing] = useState(false);
  const inputRef = useRef();
  const addLog = (msg) => setLog((p) => [...p, msg]);

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading"); setLog([]); setConstraintData(null); setResult(null);
    addLog(`Preparing: ${file.name}`);
    addLog(`Encoding: ${encodingType === "6base" ? "6-Base Epigenetic" : "4-Base Standard"}`);
    addLog("Compressing data...");
    try {
      const res = await uploadFile(file, encodingType, (msg) => addLog(msg));
      if (res.data.success) {
        addLog("Reed-Solomon encoding applied..."); addLog("DNA sequence generated..."); addLog("Stored to blockchain..."); addLog("✓ Upload complete");
        setResult(res.data); setStatus("done");
        const kc = [`FILE ID: ${res.data.file_id}`, `RETRIEVAL KEY: ${res.data.retrieval_key}`, `MERKLE ROOT: ${res.data.merkle_root}`, `ENCODING: ${res.data.encoding_type}`].join("\n");
        const b = new Blob([kc], { type: "text/plain" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `${file.name}_key.txt`; a.click(); URL.revokeObjectURL(u);
        addLog("Analyzing DNA constraints..."); setAnalyzing(true);
        try { const r = await analyzeConstraints(res.data.file_id); setConstraintData(r.data); addLog("✓ Constraint analysis complete"); } catch { addLog("⚠ Constraint analysis failed"); }
        setAnalyzing(false);
      } else { addLog(`✗ ${res.data.error}`); setStatus("error"); }
    } catch (err) { addLog(`✗ ${extractError(err, "Upload failed — server may have timed out")}`); setStatus("error"); }
  };

  const encs = [
    { id: "4base", label: "4-Base Standard", bases: "A · T · G · C", badge: "Ready now", color: "#a29bfe", desc: "Standard DNA bases. All sequencing platforms.", density: "2.0 bits/base", compat: "All platforms" },
    { id: "6base", label: "6-Base Epigenetic", bases: "A · T · G · C · 5mC · 6mA", badge: "Future-ready", color: "#f0932b", desc: "Epigenetic bases for +29% data density. Nanopore only.", density: "2.58 bits/base", compat: "Nanopore only" },
  ];

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">Upload File</div>
        <div className="page-subtitle">Select encoding, drop a file, encode and store</div>

        <div style={{ fontSize: "11px", color: "#3a3458", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>Step 1 — Encoding mode</div>
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          {encs.map((e) => (
            <div key={e.id} onClick={() => setEncodingType(e.id)}
              style={{ flex: 1, minWidth: "240px", padding: "18px", background: "#12101e", border: `1.5px solid ${encodingType === e.id ? e.color : "#1e1a2e"}`, borderRadius: "8px", cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: e.color }}>{e.label}</div>
                <span style={{ padding: "2px 10px", borderRadius: "10px", fontSize: "10px", fontWeight: "500", background: `${e.color}18`, color: e.color }}>{e.badge}</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#5a5078", marginBottom: "8px" }}>{e.bases}</div>
              <div style={{ fontSize: "12px", color: "#3a3458", lineHeight: "1.5", marginBottom: "10px" }}>{e.desc}</div>
              <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "#3a3458" }}>
                <span><span style={{ color: "#5a5078" }}>Density:</span> {e.density}</span>
                <span><span style={{ color: "#5a5078" }}>Platform:</span> {e.compat}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: "11px", color: "#3a3458", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>Step 2 — Select file</div>
        <div onClick={() => inputRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0]); }}
          style={{ border: `2px dashed ${dragging ? "#a29bfe" : file ? "#22c55e" : "#1e1a2e"}`, borderRadius: "8px", padding: "36px", textAlign: "center", cursor: "pointer", background: dragging ? "#1a1528" : file ? "#0a1a12" : "#12101e", transition: "all 0.15s", marginBottom: "20px" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px", color: file ? "#22c55e" : "#3a3458" }}>{file ? "✓" : "↑"}</div>
          <div style={{ fontSize: "13px", fontWeight: "500", color: file ? "#22c55e" : "#5a5078" }}>{file ? file.name : "Drop file here or click to browse"}</div>
          {file && <div style={{ fontSize: "12px", color: "#3a3458", marginTop: "4px" }}>{(file.size / 1024).toFixed(1)} KB</div>}
          <input ref={inputRef} type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0])} />
        </div>

        {file && (
          <div className="card" style={{ marginBottom: "20px", display: "flex", gap: "28px", flexWrap: "wrap" }}>
            {[["File", file.name], ["Size", `${(file.size / 1024).toFixed(1)} KB`], ["Encoding", encodingType === "6base" ? "6-Base Epigenetic" : "4-Base Standard"], ["Bases", encodingType === "6base" ? "A T G C 5mC 6mA" : "A T G C"]].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: "10px", color: "#3a3458", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>{k}</div>
                <div style={{ fontSize: "13px", fontWeight: "500", color: "#e0daf0" }}>{v}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: "11px", color: "#3a3458", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>Step 3 — Encode & store</div>
        <button className="btn-primary" onClick={handleUpload} disabled={!file || status === "uploading"} style={{ marginBottom: "20px" }}>
          {status === "uploading" ? "Encoding..." : "Encode & Store"}
        </button>

        {log.length > 0 && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", color: "#3a3458", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>Process log</div>
            {log.map((l, i) => (
              <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "12px", padding: "2px 0", color: l.startsWith("✓") ? "#22c55e" : l.startsWith("✗") ? "#ef4444" : l.startsWith("⚠") ? "#f0932b" : "#5a5078" }}>▸ {l}</div>
            ))}
          </div>
        )}

        {result && (
          <div className="card" style={{ border: "1px solid rgba(34,197,94,0.2)", marginBottom: "8px" }}>
            <div style={{ fontSize: "14px", fontWeight: "500", color: "#22c55e", marginBottom: "14px" }}>✓ Storage Complete</div>
            {[["File ID", result.file_id], ["Encoding", result.encoding_type === "6base" ? "6-Base Epigenetic" : "4-Base Standard"], ["Merkle Root", result.merkle_root]].map(([k, v]) => (
              <div key={k} style={{ marginBottom: "8px" }}>
                <div style={{ fontSize: "10px", color: "#3a3458", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>{k}</div>
                <div style={{ fontSize: "12px", color: "#e0daf0", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>{v}</div>
              </div>
            ))}
            <div style={{ fontSize: "12px", color: "#22c55e", marginTop: "6px" }}>✓ Retrieval key downloaded</div>
            <button className="btn-primary" style={{ marginTop: "14px" }} onClick={() => navigate("/files")}>View my files</button>
          </div>
        )}

        {analyzing && <div className="card" style={{ marginTop: "20px", color: "#48dbfb" }}>Analyzing DNA constraints...</div>}
        {constraintData && <DNAConstraintsPanel data={constraintData} />}
      </div>
    </div>
  );
}

export default Upload;


