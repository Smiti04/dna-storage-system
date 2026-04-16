import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getUserFiles, analyzeConstraints } from "../services/api";

function Dashboard() {
  const nav = useNavigate();
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({
    totalBases: 0,
    totalOligos: 0,
    avgPassRate: 0,
    filesAnalyzed: 0,
    loading: true,
  });

  useEffect(() => {
    getUserFiles().then(async (r) => {
      const fileList = r.data.files;
      setFiles(fileList);

      if (fileList.length === 0) {
        setStats(s => ({ ...s, loading: false }));
        return;
      }

      const toAnalyze = fileList.slice(0, 10);
      let totalBases = 0, totalOligos = 0, totalPassRate = 0, analyzed = 0;

      await Promise.all(toAnalyze.map(async (f) => {
        try {
          const res = await analyzeConstraints(f.file_id);
          const s = res.data.summary || {};
          const frags = res.data.fragments || [];
          totalBases += frags.reduce((sum, fr) => sum + (fr.length || 0), 0);
          totalOligos += s.total_fragments || frags.length;
          totalPassRate += s.pass_rate || 0;
          analyzed++;
        } catch {}
      }));

      setStats({
        totalBases,
        totalOligos,
        avgPassRate: analyzed > 0 ? Math.round(totalPassRate / analyzed) : 0,
        filesAnalyzed: analyzed,
        loading: false,
      });
    }).catch(() => setStats(s => ({ ...s, loading: false })));
  }, []);

  const acts = [
    { label: "Upload File", sub: "Encode & store in DNA", icon: "↑", path: "/upload", color: "#a29bfe", bg: "#1a1528" },
    { label: "My Files", sub: "View stored files", icon: "◈", path: "/files", color: "#48dbfb", bg: "#0c1a22" },
    { label: "Retrieve", sub: "Decode & download", icon: "↓", path: "/retrieve", color: "#f0932b", bg: "#1a1210" },
  ];

  const sl = { fontSize: "12px", fontWeight: "700", color: "#9a8fc0", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" };

  const formatBases = (n) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toString();
  };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">Welcome to DNA Vault — archiving data in living molecules</div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
          {[
            ["Files stored", files.length, "#a29bfe"],
            ["Total Oligos", stats.loading ? "..." : stats.totalOligos.toLocaleString(), "#48dbfb"],
            ["DNA Bases", stats.loading ? "..." : formatBases(stats.totalBases), "#f0932b"],
            ["Avg Pass Rate", stats.loading ? "..." : `${stats.avgPassRate}%`, stats.avgPassRate >= 90 ? "#22c55e" : "#f0932b"],
          ].map(([l, v, c]) => (
            <div key={l} className="card" style={{ flex: 1, minWidth: "150px" }}>
              <div style={{ fontSize: "12px", color: "#9a8fc0", textTransform: "uppercase", marginBottom: "6px", fontWeight: "700" }}>{l}</div>
              <div style={{ fontSize: "26px", fontWeight: "700", color: c, fontFamily: "var(--font-mono)" }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
          {[
            ["System", "Online", "#22c55e"],
            ["Encoding", "4-Base / 6-Base", "#a29bfe"],
            ["Error Correction", "Reed-Solomon + XOR", "#48dbfb"],
            ["Verification", "SHA-256 + Merkle", "#f0932b"],
          ].map(([l, v, c]) => (
            <div key={l} className="card" style={{ flex: 1, minWidth: "150px" }}>
              <div style={{ fontSize: "11px", color: "#9a8fc0", textTransform: "uppercase", marginBottom: "4px", fontWeight: "700" }}>{l}</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: c }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={sl}>Quick actions</div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "28px" }}>
          {acts.map(a => (
            <button key={a.path} onClick={() => nav(a.path)} style={{ flex: 1, minWidth: "180px", padding: "18px", background: "#12101e", border: "1px solid #2a2440", borderRadius: "8px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
              onMouseOver={e => e.currentTarget.style.borderColor = a.color + "55"} onMouseOut={e => e.currentTarget.style.borderColor = "#2a2440"}>
              <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: a.color, marginBottom: "10px" }}>{a.icon}</div>
              <div style={{ fontSize: "15px", fontWeight: "600", color: "#f0ecf8", marginBottom: "3px" }}>{a.label}</div>
              <div style={{ fontSize: "13px", color: "#9a8fc0", fontWeight: "500" }}>{a.sub}</div>
            </button>
          ))}
        </div>

        {files.length > 0 && (<>
          <div style={sl}>Recent files</div>
          <div className="card" style={{ marginBottom: "28px" }}>
            {files.slice(0, 5).map((f, i) => (
              <div key={f.file_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < Math.min(files.length, 5) - 1 ? "1px solid #2a2440" : "none" }}>
                <div><div style={{ fontSize: "14px", fontWeight: "600", color: "#f0ecf8" }}>{f.filename}</div><div style={{ fontSize: "12px", color: "#9a8fc0", fontFamily: "var(--font-mono)", fontWeight: "500" }}>{f.file_id}</div></div>
                <button className="btn-primary" style={{ padding: "5px 12px", fontSize: "12px" }} onClick={() => nav("/files")}>View</button>
              </div>
            ))}
          </div>
        </>)}

        {files.length === 0 && !stats.loading && (
          <div className="card" style={{ textAlign: "center", padding: "32px" }}>
            <div style={{ color: "#9a8fc0", fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>No files stored yet</div>
            <button className="btn-primary" onClick={() => nav("/upload")}>Upload your first file</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
