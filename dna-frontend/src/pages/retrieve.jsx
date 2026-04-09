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

    setStatus("loading");
    setLogs(["Initializing retrieval..."]);

    try {
      const res = await retrieveFile(fileId, key, (msg) => addLog(msg));

      const contentType = res.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([res.data], { type: contentType });

      let filename = "retrieved_file";
      const cd = res.headers["content-disposition"];
      if (cd) {
        const m = cd.match(/filename[^;=\n]*=\s*["']?([^"';\n]+)["']?/i);
        if (m?.[1]) filename = m[1].trim();
      }

      if (!filename.includes(".")) {
        const mimeToExt = {
          "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif",
          "application/pdf": "pdf", "text/plain": "txt",
          "application/zip": "zip", "application/json": "json",
          "video/mp4": "mp4", "audio/mpeg": "mp3",
        };
        const ext = mimeToExt[contentType.split(";")[0].trim()];
        if (ext) filename = `${filename}.${ext}`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      a.click(); URL.revokeObjectURL(url);

      addLog(`✓ "${filename}" downloaded successfully`);
      setStatus("done");

    } catch (err) {
      let reason = "Retrieval failed";

      // arraybuffer error responses need decoding
      if (err?.response?.data instanceof ArrayBuffer) {
        try {
          const text = new TextDecoder().decode(err.response.data);
          const json = JSON.parse(text);
          reason = json.detail || reason;
        } catch {
          reason = extractError(err, "Retrieval failed");
        }
      } else {
        reason = extractError(err, "Retrieval failed");
      }

      addLog(`✗ ${reason}`);
      setStatus("error");
    }
  };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">RETRIEVE FILE</div>
        <div className="page-subtitle">ENTER YOUR FILE ID AND RETRIEVAL KEY TO DECODE</div>

        <div className="card" style={{ maxWidth: "560px", marginBottom: "20px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", marginBottom: "6px" }}>FILE ID</label>
            <input className="input-field" value={fileId} onChange={e => setFileId(e.target.value)} placeholder="enter file id" />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", marginBottom: "6px" }}>RETRIEVAL KEY</label>
            <input className="input-field" value={key} onChange={e => setKey(e.target.value)} placeholder="enter retrieval key" />
          </div>
          <button className="btn-primary" onClick={handleRetrieve} disabled={status === "loading"}>
            {status === "loading" ? "DECODING..." : "RETRIEVE FILE →"}
          </button>
        </div>

        {logs.length > 0 && (
          <div className="card" style={{ maxWidth: "560px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", marginBottom: "12px" }}>PROCESS LOG</div>
            {logs.map((l, i) => (
              <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "12px", padding: "3px 0", color: l.startsWith("✓") ? "var(--neon-green)" : l.startsWith("✗") ? "#ef4444" : "var(--text-secondary)" }}>
                ▸ {l}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Retrieve;