import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getUserFiles, deleteFile, extractError } from "../services/api";

function ViewFiles() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { getUserFiles().then(r => setFiles(r.data.files)).catch(e => setError(extractError(e, "Failed to load"))); }, []);

  const handleDelete = async (fid) => {
    if (!window.confirm("Delete this file permanently?")) return;
    setDeletingId(fid);
    try { await deleteFile(fid); setTimeout(() => { setFiles(p => p.filter(f => f.file_id !== fid)); setDeletingId(null); }, 300); }
    catch (e) { alert(`Delete failed: ${extractError(e)}`); setDeletingId(null); }
  };

  const acts = (f) => [
    { label: "Retrieve", color: "#48dbfb", fn: () => navigate("/retrieve", { state: { fileId: f.file_id } }) },
    { label: "Sequence", color: "#a29bfe", fn: () => navigate("/sequence", { state: { fileId: f.file_id, filename: f.filename } }) },
    { label: "Delete", color: "#ef4444", fn: () => handleDelete(f.file_id) },
  ];

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">My Files</div>
        <div className="page-subtitle">{files.length} file{files.length !== 1 ? "s" : ""} stored in DNA Vault</div>

        {error && <div style={{ fontSize: "13px", color: "#ef4444", marginBottom: "14px", padding: "10px 14px", background: "#1a0a0a", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

        {files.length === 0 && !error ? (
          <div className="card" style={{ textAlign: "center", padding: "44px" }}>
            <div style={{ color: "#3a3458", fontSize: "13px" }}>No files stored yet</div>
            <button className="btn-primary" style={{ marginTop: "16px" }} onClick={() => navigate("/upload")}>Upload first file</button>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 1fr 100px auto", gap: "14px", padding: "10px 18px", borderBottom: "1px solid #1e1a2e", background: "#0e0c18" }}>
              {["#", "File ID", "Filename", "Encoding", "Actions"].map(h => <div key={h} style={{ fontSize: "10px", color: "#3a3458", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>)}
            </div>
            {files.map((f, i) => (
              <div key={f.file_id} style={{ display: "grid", gridTemplateColumns: "44px 1fr 1fr 100px auto", gap: "14px", padding: "12px 18px", borderBottom: i < files.length - 1 ? "1px solid #1e1a2e" : "none", alignItems: "center", opacity: deletingId === f.file_id ? 0 : 1, transition: "opacity 0.3s, background 0.15s" }}
                onMouseOver={e => e.currentTarget.style.background = "#16132a"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ fontSize: "12px", color: "#3a3458" }}>{i + 1}</div>
                <div style={{ fontSize: "11px", color: "#5a5078", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>{f.file_id}</div>
                <div style={{ fontSize: "13px", fontWeight: "500", color: "#e0daf0" }}>{f.filename}</div>
                <span style={{ padding: "3px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "500", background: f.encoding_type === "6base" ? "#1a1210" : "#1a1528", color: f.encoding_type === "6base" ? "#f0932b" : "#a29bfe", display: "inline-block", width: "fit-content" }}>
                  {f.encoding_type === "6base" ? "6-Base" : "4-Base"}
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {acts(f).map(a => (
                    <button key={a.label} onClick={a.fn} style={{ padding: "5px 10px", background: "transparent", border: `1px solid ${a.color}33`, borderRadius: "5px", color: a.color, fontSize: "11px", fontWeight: "500", cursor: "pointer", transition: "all 0.15s" }}
                      onMouseOver={e => { e.target.style.background = a.color; e.target.style.color = "#fff"; }}
                      onMouseOut={e => { e.target.style.background = "transparent"; e.target.style.color = a.color; }}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewFiles;
