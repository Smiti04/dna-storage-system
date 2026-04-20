import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  uploadFile,
  analyzeConstraints,
  getJobStatus,
  extractError,
  vaultSave,
} from "../services/api";
import DNAConstraintsPanel from "../components/DNAConstraintsPanel";
import { downloadConstraintsReport } from "../utils/downloadReport";
import { encryptKey } from "../utils/vaultCrypto";

function Upload() {
  const nav = useNavigate();
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [enc, setEnc] = useState("4base");
  const [status, setStatus] = useState("idle");
  const [log, setLog] = useState([]);
  const [result, setResult] = useState(null);
  const [cData, setCData] = useState(null);
  const [azing, setAzing] = useState(false);
  const [progress, setProgress] = useState(0);

  // NEW — tags + vault state
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [saveToVault, setSaveToVault] = useState(false);
  const [vaultPassword, setVaultPassword] = useState("");

  const ref = useRef();
  const addLog = (m) => setLog((p) => [...p, m]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const removeTag = (t) => setTags(tags.filter((x) => x !== t));

  const handleTagKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  // Save the returned retrieval key to the encrypted vault (if user opted in)
  const saveKeyToVault = async (retrieval_key, file_id, filename) => {
    if (!saveToVault) return;
    if (!vaultPassword) {
      addLog("⚠ Vault skipped — no password entered");
      return;
    }
    try {
      const payload = await encryptKey(retrieval_key, vaultPassword);
      await vaultSave({ filename, file_id, ...payload });
      addLog("✓ Retrieval key saved to encrypted vault");
    } catch (e) {
      addLog("⚠ Could not save to vault — keep the downloaded key file safe");
      console.error(e);
    } finally {
      setVaultPassword(""); // scrub password from memory
    }
  };

  const pollJob = async (jobId) => {
    let attempts = 0;
    const maxAttempts = 300;
    while (attempts < maxAttempts) {
      attempts++;
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const res = await getJobStatus(jobId);
        const job = res.data;
        setProgress(job.progress || 0);
        if (job.status === "compressing") addLog("Compressing file...");
        if (job.status === "storing") addLog("Storing fragments...");
        if (job.status === "done") {
          const r = job.result;
          addLog("Reed-Solomon applied...");
          addLog("DNA generated...");
          addLog("Blockchain stored...");
          addLog("✓ Upload complete");
          setResult(r); setStatus("done"); setProgress(100);

          const kc = [
            `FILE ID: ${r.file_id}`,
            `RETRIEVAL KEY: ${r.retrieval_key}`,
            `MERKLE ROOT: ${r.merkle_root}`,
            `ENCODING: ${r.encoding_type}`,
          ].join("\n");
          const b = new Blob([kc], { type: "text/plain" });
          const u = URL.createObjectURL(b);
          const a = document.createElement("a");
          a.href = u;
          a.download = `${file.name}_key.txt`;
          a.click();
          URL.revokeObjectURL(u);

          // NEW — save to vault if opted in
          await saveKeyToVault(r.retrieval_key, r.file_id, file.name);

          addLog("Analyzing constraints...");
          setAzing(true);
          try {
            const x = await analyzeConstraints(r.file_id);
            setCData(x.data);
            addLog("✓ Analysis complete");
          } catch {
            addLog("⚠ Analysis failed");
          }
          setAzing(false);
          return;
        }
        if (job.status === "failed") {
          addLog(`✗ ${job.error || "Encoding failed"}`);
          setStatus("error");
          return;
        }
      } catch { }
    }
    addLog("✗ Encoding timed out");
    setStatus("error");
  };

  const doUp = async () => {
    if (!file) return;
    if (saveToVault && !vaultPassword) {
      alert("Please enter your vault password or uncheck 'Save to vault'.");
      return;
    }
    setStatus("uploading");
    setLog([]);
    setCData(null);
    setResult(null);
    setProgress(0);

    addLog(`Preparing: ${file.name}`);
    addLog(`Encoding: ${enc === "6base" ? "6-Base Epigenetic" : "4-Base Standard"}`);
    if (tags.length) addLog(`Tags: ${tags.join(", ")}`);
    addLog("Uploading to server...");

    try {
      const r = await uploadFile(file, enc, (m) => addLog(m), tags);
      if (r.data.async && r.data.job_id) {
        addLog(`File received — encoding in background...`);
        addLog(`Job ID: ${r.data.job_id}`);
        setStatus("encoding");
        await pollJob(r.data.job_id);
        return;
      }
      if (r.data.success) {
        addLog("Compressing...");
        addLog("Reed-Solomon applied...");
        addLog("DNA generated...");
        addLog("Blockchain stored...");
        addLog("✓ Upload complete");
        setResult(r.data);
        setStatus("done");
        setProgress(100);

        const kc = [
          `FILE ID: ${r.data.file_id}`,
          `RETRIEVAL KEY: ${r.data.retrieval_key}`,
          `MERKLE ROOT: ${r.data.merkle_root}`,
          `ENCODING: ${r.data.encoding_type}`,
        ].join("\n");
        const b = new Blob([kc], { type: "text/plain" });
        const u = URL.createObjectURL(b);
        const a = document.createElement("a");
        a.href = u;
        a.download = `${file.name}_key.txt`;
        a.click();
        URL.revokeObjectURL(u);

        // NEW — save to vault if opted in
        await saveKeyToVault(r.data.retrieval_key, r.data.file_id, file.name);

        addLog("Analyzing constraints...");
        setAzing(true);
        try {
          const x = await analyzeConstraints(r.data.file_id);
          setCData(x.data);
          addLog("✓ Analysis complete");
        } catch {
          addLog("⚠ Analysis failed");
        }
        setAzing(false);
      } else {
        addLog(`✗ ${r.data.error}`);
        setStatus("error");
      }
    } catch (e) {
      addLog(`✗ ${extractError(e, "Upload failed")}`);
      setStatus("error");
    }
  };

  const encs = [
    { id: "4base", label: "4-Base Standard", bases: "A · T · G · C", badge: "Ready now", color: "#a29bfe", desc: "Standard DNA. All platforms.", density: "2.0 bits/base", compat: "All platforms" },
    { id: "6base", label: "6-Base Epigenetic", bases: "A · T · G · C · 5mC · 6mA", badge: "Future-ready", color: "#f0932b", desc: "Epigenetic +29% density. Nanopore only.", density: "2.58 bits/base", compat: "Nanopore only" },
  ];
  const sl = { fontSize: "12px", fontWeight: "700", color: "#9a8fc0", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" };

  // Small inline styles for the new tag chips
  const chipStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "12px",
    background: "rgba(240, 147, 43, 0.15)",
    border: "1px solid rgba(240, 147, 43, 0.4)",
    color: "#f0932b",
    fontSize: "12px",
    fontWeight: 600,
  };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">Upload File</div>
        <div className="page-subtitle">Select encoding, drop a file, encode and store</div>

        <div style={sl}>Step 1 — Encoding mode</div>
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          {encs.map((e) => (
            <div key={e.id} onClick={() => setEnc(e.id)} style={{ flex: 1, minWidth: "240px", padding: "18px", background: "#12101e", border: `1.5px solid ${enc === e.id ? e.color : "#2a2440"}`, borderRadius: "8px", cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ fontSize: "15px", fontWeight: "700", color: e.color }}>{e.label}</div>
                <span style={{ padding: "2px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "600", background: `${e.color}18`, color: e.color }}>{e.badge}</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#c4b5fd", fontWeight: "500", marginBottom: "8px" }}>{e.bases}</div>
              <div style={{ fontSize: "13px", color: "#9a8fc0", lineHeight: "1.5", fontWeight: "500", marginBottom: "10px" }}>{e.desc}</div>
              <div style={{ display: "flex", gap: "16px", fontSize: "12px", fontWeight: "500" }}>
                <span style={{ color: "#9a8fc0" }}><span style={{ color: "#c4b5fd", fontWeight: "600" }}>Density:</span> {e.density}</span>
                <span style={{ color: "#9a8fc0" }}><span style={{ color: "#c4b5fd", fontWeight: "600" }}>Platform:</span> {e.compat}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={sl}>Step 2 — Select file</div>
        <div onClick={() => ref.current.click()} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); setFile(e.dataTransfer.files[0]); }}
          style={{ border: `2px dashed ${drag ? "#a29bfe" : file ? "#22c55e" : "#2a2440"}`, borderRadius: "8px", padding: "36px", textAlign: "center", cursor: "pointer", background: drag ? "#1a1528" : file ? "#0a1a12" : "#12101e", transition: "all 0.15s", marginBottom: "20px" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px", color: file ? "#22c55e" : "#6b5f8a" }}>{file ? "✓" : "↑"}</div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: file ? "#22c55e" : "#c4b5fd" }}>{file ? file.name : "Drop file here or click to browse"}</div>
          {file && <div style={{ fontSize: "13px", color: "#9a8fc0", marginTop: "4px", fontWeight: "500" }}>{(file.size / 1024).toFixed(1)} KB</div>}
          <input ref={ref} type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0])} />
        </div>

        {file && (
          <div className="card" style={{ marginBottom: "20px", display: "flex", gap: "28px", flexWrap: "wrap" }}>
            {[["File", file.name], ["Size", `${(file.size / 1024).toFixed(1)} KB`], ["Encoding", enc === "6base" ? "6-Base Epigenetic" : "4-Base Standard"], ["Bases", enc === "6base" ? "A T G C 5mC 6mA" : "A T G C"]].map(([k, v]) => (
              <div key={k}><div style={{ fontSize: "11px", color: "#9a8fc0", textTransform: "uppercase", marginBottom: "3px", fontWeight: "700" }}>{k}</div><div style={{ fontSize: "14px", fontWeight: "600", color: "#f0ecf8" }}>{v}</div></div>
            ))}
          </div>
        )}

        {/* =========== NEW — Step 3: Tags =========== */}
        <div style={sl}>Step 3 — Searchable tags (optional)</div>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="e.g. thesis, chapter-3, raw-data"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKey}
              style={{
                flex: 1,
                padding: "10px 12px",
                background: "#12101e",
                border: "1.5px solid #2a2440",
                borderRadius: "6px",
                color: "#f0ecf8",
                fontSize: "13px",
                fontFamily: "inherit",
              }}
            />
            <button
              type="button"
              onClick={addTag}
              style={{
                padding: "10px 18px",
                background: "transparent",
                border: "1.5px solid #48dbfb44",
                borderRadius: "6px",
                color: "#48dbfb",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Add
            </button>
          </div>
          <div style={{ fontSize: "11px", color: "#6b5f8a", marginBottom: "10px", fontWeight: 500 }}>
            Press Enter or comma to add. Tags let you find this file later by keyword.
          </div>
          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {tags.map((t) => (
                <span key={t} style={chipStyle}>
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    style={{ background: "none", border: "none", color: "#f0932b", cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* =========== NEW — Step 4: Save to vault =========== */}
        <div style={sl}>Step 4 — Key recovery (optional)</div>
        <div className="card" style={{ marginBottom: "20px", padding: "16px" }}>
          <label style={{ display: "flex", gap: "10px", alignItems: "start", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={saveToVault}
              onChange={(e) => setSaveToVault(e.target.checked)}
              style={{ marginTop: "3px", accentColor: "#a29bfe", width: "16px", height: "16px" }}
            />
            <span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#f0ecf8" }}>
                Save retrieval key to my encrypted vault
              </span>
              <div style={{ fontSize: "12px", color: "#9a8fc0", marginTop: "4px", fontWeight: 500, lineHeight: 1.5 }}>
                If you lose the downloaded key file, you can recover it from the vault using your password.
                Encrypted in your browser with AES-256 — the server never sees the key.
              </div>
            </span>
          </label>
          {saveToVault && (
            <input
              type="password"
              placeholder="Confirm your password to encrypt the key"
              value={vaultPassword}
              onChange={(e) => setVaultPassword(e.target.value)}
              style={{
                marginTop: "12px",
                width: "100%",
                padding: "10px 12px",
                background: "#0a0912",
                border: "1.5px solid #2a2440",
                borderRadius: "6px",
                color: "#f0ecf8",
                fontSize: "13px",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          )}
        </div>

        <div style={sl}>Step 5 — Encode & store</div>
        <button className="btn-primary" onClick={doUp} disabled={!file || status === "uploading" || status === "encoding"} style={{ marginBottom: "20px" }}>
          {status === "uploading" ? "Uploading..." : status === "encoding" ? "Encoding..." : "Encode & Store"}
        </button>

        {status === "encoding" && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#c4b5fd" }}>Encoding in progress...</span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#a29bfe", fontFamily: "var(--font-mono)" }}>{progress}%</span>
            </div>
            <div style={{ width: "100%", height: "6px", background: "#1a1528", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #a29bfe, #48dbfb)", borderRadius: "3px", transition: "width 0.5s ease" }} />
            </div>
            <div style={{ fontSize: "11px", color: "#6b5f8a", marginTop: "6px", fontWeight: "500" }}>Large files are encoded in the background. This page will update automatically.</div>
          </div>
        )}

        {log.length > 0 && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <div style={sl}>Process log</div>
            {log.map((l, i) => (
              <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: "500", padding: "2px 0", color: l.startsWith("✓") ? "#22c55e" : l.startsWith("✗") ? "#ef4444" : l.startsWith("⚠") ? "#f0932b" : "#c4b5fd" }}>▸ {l}</div>
            ))}
          </div>
        )}

        {result && (
          <div className="card" style={{ border: "1px solid rgba(34,197,94,0.3)", marginBottom: "8px" }}>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#22c55e", marginBottom: "14px" }}>✓ Storage Complete</div>
            {[["File ID", result.file_id], ["Encoding", result.encoding_type === "6base" ? "6-Base Epigenetic" : "4-Base Standard"], ["Merkle Root", result.merkle_root]].map(([k, v]) => (
              <div key={k} style={{ marginBottom: "8px" }}><div style={{ fontSize: "11px", color: "#9a8fc0", textTransform: "uppercase", marginBottom: "2px", fontWeight: "700" }}>{k}</div><div style={{ fontSize: "13px", color: "#f0ecf8", fontFamily: "var(--font-mono)", wordBreak: "break-all", fontWeight: "500" }}>{v}</div></div>
            ))}
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#22c55e", marginTop: "6px" }}>✓ Retrieval key downloaded</div>
            <button className="btn-primary" style={{ marginTop: "14px" }} onClick={() => nav("/files")}>View my files</button>
          </div>
        )}

        {azing && <div className="card" style={{ marginTop: "20px", color: "#48dbfb", fontWeight: "600" }}>Analyzing DNA constraints...</div>}

        {cData && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", marginBottom: "10px" }}>
              <div style={{ ...sl, marginBottom: 0 }}>DNA Constraints Analysis</div>
              <button onClick={() => downloadConstraintsReport(cData, file?.name || "upload")}
                style={{ padding: "6px 14px", background: "transparent", border: "1px solid #48dbfb44", borderRadius: "5px", color: "#48dbfb", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "6px" }}
                onMouseOver={e => { e.currentTarget.style.background = "#48dbfb"; e.currentTarget.style.color = "#fff"; }}
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#48dbfb"; }}>
                ↓ Download Report
              </button>
            </div>
            <DNAConstraintsPanel data={cData} />
          </div>
        )}
      </div>
    </div>
  );
}
export default Upload;
