import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getUserFiles, deleteFile, extractError } from "../services/api";

function ViewFiles() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { getUserFiles().then((res) => setFiles(res.data.files)).catch((err) => setError(extractError(err, "Failed to load files"))); }, []);

  const handleDelete = async (file_id) => {
    if (!window.confirm("Delete this file permanently?")) return;
    setDeletingId(file_id);
    try { await deleteFile(file_id); setTimeout(() => { setFiles((prev) => prev.filter((f) => f.file_id !== file_id)); setDeletingId(null); }, 300); }
    catch (err) { alert(`Delete failed: ${extractError(err, "Delete failed")}`); setDeletingId(null); }
  };

  const getActions = (f) => [
    { label: "Retrieve", color: "#2563eb", fn: () => navigate("/retrieve", { state: { fileId: f.file_id } }) },
    { label: "Sequence", color: "#7c3aed", fn: () => navigate("/sequence", { state: { fileId: f.file_id, filename: f.filename } }) },
    { label: "Delete", color: "#ef4444", danger: true, fn: () => handleDelete(f.file_id) },
  ];

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">My Files</div>
        <div className="page-subtitle">{files.length} file{files.length !== 1 ? "s" : ""} stored in DNA database</div>

        {error && <div style={{ fontSize: "13px", color: "#ef4444", marginBottom: "16px", padding: "10px 14px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fee2e2" }}>{error}</div>}

        {files.length === 0 && !error ? (
          <div className="card" style={{ textAlign: "center", padding: "48px" }}>
            <div style={{ color: "#94a3b8", fontSize: "14px" }}>No files stored yet</div>
            <button className="btn-primary" style={{ marginTop: "20px" }} onClick={() => navigate("/upload")}>Upload first file</button>
          </div>
        ) : (
          <div className="card" style={{ padding: "0", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 1fr 120px auto", gap: "16px", padding: "12px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
              {["#", "File ID", "Filename", "Encoding", "Actions"].map((h) => (
                <div key={h} style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
              ))}
            </div>

            {files.map((f, i) => (
              <div key={f.file_id}
                style={{ display: "grid", gridTemplateColumns: "48px 1fr 1fr 120px auto", gap: "16px", padding: "14px 20px", borderBottom: i < files.length - 1 ? "1px solid #f1f5f9" : "none", alignItems: "center", opacity: deletingId === f.file_id ? 0 : 1, transition: "opacity 0.3s, background 0.15s" }}
                onMouseOver={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>{i + 1}</div>
                <div style={{ fontSize: "12px", color: "#64748b", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>{f.file_id}</div>
                <div style={{ fontSize: "14px", fontWeight: "500", color: "#0f172a" }}>{f.filename}</div>
                <div>
                  <span style={{
                    padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "600",
                    background: f.encoding_type === "6base" ? "#eff6ff" : "#f0fdf4",
                    color: f.encoding_type === "6base" ? "#2563eb" : "#16a34a",
                  }}>
                    {f.encoding_type === "6base" ? "6-Base" : "4-Base"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {getActions(f).map((a) => (
                    <button key={a.label} onClick={a.fn}
                      style={{ padding: "5px 12px", background: "transparent", border: `1px solid ${a.color}40`, borderRadius: "6px", color: a.color, fontSize: "12px", fontWeight: "500", cursor: "pointer", transition: "all 0.15s" }}
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
