import { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { retrieveFile, extractError } from "../services/api";

function Retrieve() {
  const location = useLocation();
  const [fileId, setFileId] = useState(location.state?.fileId || "");
  const [key, setKey] = useState("");
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState("idle");
  const addLog = (msg) => setLogs((p) => [...p, msg]);

  const handleRetrieve = async () => {
    if (!fileId.trim()) { setLogs(["✗ File ID is required"]); return; }
    if (!key.trim()) { setLogs(["✗ Retrieval key is required"]); return; }
    setStatus("loading"); setLogs(["Initializing retrieval..."]);
    try {
      const res = await retrieveFile(fileId, key, (msg) => addLog(msg));
      const ct = res.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([res.data], { type: ct });
      let fn = "retrieved_file";
      const cd = res.headers["content-disposition"];
      if (cd) { const m = cd.match(/filename[^;=\n]*=\s*["']?([^"';\n]+)["']?/i); if (m?.[1]) fn = m[1].trim(); }
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = fn; a.click(); URL.revokeObjectURL(url);
      addLog(`✓ "${fn}" downloaded successfully`); setStatus("done");
    } catch (err) {
      let reason = "Retrieval failed";
      if (err?.response?.data instanceof ArrayBuffer) { try { const t = new TextDecoder().decode(err.response.data); reason = JSON.parse(t).detail || reason; } catch { reason = extractError(err, "Retrieval failed"); } }
      else reason = extractError(err, "Retrieval failed");
      addLog(`✗ ${reason}`); setStatus("error");
    }
  };

  const label = { display: "block", fontSize: "13px", fontWeight: "500", color: "#5a5078", marginBottom: "6px" };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">Retrieve File</div>
        <div className="page-subtitle">Enter your file ID and retrieval key to decode</div>
        <div className="card" style={{ maxWidth: "520px", marginBottom: "20px" }}>
          <div style={{ marginBottom: "14px" }}><label style={label}>File ID</label><input className="input-field" value={fileId} onChange={e => setFileId(e.target.value)} placeholder="Enter file ID" /></div>
          <div style={{ marginBottom: "18px" }}><label style={label}>Retrieval Key</label><input className="input-field" value={key} onChange={e => setKey(e.target.value)} placeholder="Enter retrieval key" /></div>
          <button className="btn-primary" onClick={handleRetrieve} disabled={status === "loading"}>{status === "loading" ? "Decoding..." : "Retrieve File"}</button>
        </div>
        {logs.length > 0 && (
          <div className="card" style={{ maxWidth: "520px" }}>
            <div style={{ fontSize: "11px", color: "#3a3458", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>Process log</div>
            {logs.map((l, i) => <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "12px", padding: "2px 0", color: l.startsWith("✓") ? "#22c55e" : l.startsWith("✗") ? "#ef4444" : "#5a5078" }}>▸ {l}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

export default Retrieve;
