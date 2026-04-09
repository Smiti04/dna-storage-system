import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getUserFiles, deleteFile, extractError } from "../services/api";

function ViewFiles() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getUserFiles()
      .then((res) => setFiles(res.data.files))
      .catch((err) => setError(extractError(err, "Failed to load files")));
  }, []);

  const handleDelete = async (file_id) => {
    if (!window.confirm("Delete this file permanently?")) return;
    setDeletingId(file_id);
    try {
      await deleteFile(file_id);
      setTimeout(() => {
        setFiles((prev) => prev.filter((f) => f.file_id !== file_id));
        setDeletingId(null);
      }, 300);
    } catch (err) {
      const reason = extractError(err, "Delete failed");
      alert(`Delete failed: ${reason}`);
      setDeletingId(null);
    }
  };

  const getActions = (f) => [
    {
      label: "RETRIEVE",
      color: "var(--neon-blue)",
      fn: () => navigate("/retrieve", { state: { fileId: f.file_id } }),
    },
    {
      label: "SEQUENCE",
      color: "var(--neon-green)",
      fn: () => navigate("/sequence", { state: { fileId: f.file_id, filename: f.filename } }),
    },
    {
      label: "DELETE",
      color: "#ef4444",
      danger: true,
      fn: () => handleDelete(f.file_id),
    },
  ];

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">MY FILES</div>
        <div className="page-subtitle">
          {files.length} FILE{files.length !== 1 ? "S" : ""} STORED IN DNA DATABASE
        </div>

        {/* Load error */}
        {error && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#ef4444", marginBottom: "16px", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.2)" }}>
            ⚠ {error}
          </div>
        )}

        {files.length === 0 && !error ? (
          <div className="card" style={{ textAlign: "center", padding: "48px" }}>
            <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "13px" }}>NO FILES STORED YET</div>
            <button className="btn-primary" style={{ marginTop: "20px" }} onClick={() => navigate("/upload")}>UPLOAD FIRST FILE →</button>
          </div>
        ) : (
          <div className="card" style={{ padding: "0", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 1fr 120px auto", gap: "16px", padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
              {["#", "FILE ID", "FILENAME", "ENCODING", "ACTIONS"].map((h) => (
                <div key={h} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "2px" }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {files.map((f, i) => (
              <div
                key={f.file_id}
                style={{ display: "grid", gridTemplateColumns: "48px 1fr 1fr 120px auto", gap: "16px", padding: "16px 20px", borderBottom: i < files.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", opacity: deletingId === f.file_id ? 0 : 1, transition: "opacity 0.3s, background 0.2s", background: "transparent" }}
                onMouseOver={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>{i + 1}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", wordBreak: "break-all" }}>{f.file_id}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-primary)" }}>{f.filename}</div>

                {/* Encoding badge */}
                <div>
                  <span style={{
                    padding: "4px 10px", borderRadius: "4px", fontSize: "10px",
                    fontFamily: "var(--font-mono)", letterSpacing: "1px",
                    background: f.encoding_type === "6base" ? "rgba(0,212,255,0.1)" : "rgba(0,255,136,0.1)",
                    color: f.encoding_type === "6base" ? "var(--neon-blue)" : "var(--neon-green)",
                    border: `1px solid ${f.encoding_type === "6base" ? "rgba(0,212,255,0.3)" : "rgba(0,255,136,0.3)"}`,
                  }}>
                    {f.encoding_type === "6base" ? "6-BASE" : "4-BASE"}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px" }}>
                  {getActions(f).map((a) => (
                    <button
                      key={a.label}
                      onClick={a.fn}
                      style={{ padding: "6px 12px", background: "transparent", border: `1px solid ${a.color}55`, borderRadius: "4px", color: a.color, fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "1px", cursor: "pointer", transition: "all 0.2s" }}
                      onMouseOver={e => { e.target.style.background = a.color; e.target.style.color = a.danger ? "#fff" : "#000"; }}
                      onMouseOut={e => { e.target.style.background = "transparent"; e.target.style.color = a.color; }}
                    >
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