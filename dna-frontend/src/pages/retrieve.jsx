import { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { retrieveFile, extractError } from "../services/api";

function Retrieve() {
  const loc = useLocation();
  const [fid, setFid] = useState(loc.state?.fileId || "");
  const [key, setKey] = useState("");
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState("idle");
  const addLog = (m) => setLogs((p) => [...p, m]);

  const doRetrieve = async () => {
    if (!fid.trim()) { setLogs(["✗ File ID is required"]); return; }
    if (!key.trim()) { setLogs(["✗ Retrieval key is required"]); return; }
    setStatus("loading"); setLogs(["Initializing retrieval..."]);
    try {
      const r = await retrieveFile(fid, key, (m) => addLog(m));
      const ct = r.headers["content-type"]||"application/octet-stream";
      const blob = new Blob([r.data],{type:ct});
      let fn = "retrieved_file";
      const cd = r.headers["content-disposition"];
      if (cd) { const m = cd.match(/filename[^;=\n]*=\s*["']?([^"';\n]+)["']?/i); if (m?.[1]) fn=m[1].trim(); }
      const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=u; a.download=fn; a.click(); URL.revokeObjectURL(u);
      addLog(`✓ "${fn}" downloaded`); setStatus("done");
    } catch (e) {
      let reason = "Retrieval failed";
      if (e?.response?.data instanceof ArrayBuffer) { try { reason = JSON.parse(new TextDecoder().decode(e.response.data)).detail||reason; } catch { reason = extractError(e,"Retrieval failed"); } }
      else reason = extractError(e,"Retrieval failed");
      addLog(`✗ ${reason}`); setStatus("error");
    }
  };

  const lb = {display:"block",fontSize:"14px",fontWeight:"600",color:"#c4b5fd",marginBottom:"6px"};

  return (
    <div className="page-layout"><Sidebar />
      <div className="page-content">
        <div className="page-title">Retrieve File</div>
        <div className="page-subtitle">Enter your file ID and retrieval key to decode</div>
        <div className="card" style={{maxWidth:"520px",marginBottom:"20px"}}>
          <div style={{marginBottom:"14px"}}><label style={lb}>File ID</label><input className="input-field" value={fid} onChange={e=>setFid(e.target.value)} placeholder="Enter file ID" /></div>
          <div style={{marginBottom:"18px"}}><label style={lb}>Retrieval Key</label><input className="input-field" value={key} onChange={e=>setKey(e.target.value)} placeholder="Enter retrieval key" /></div>
          <button className="btn-primary" onClick={doRetrieve} disabled={status==="loading"}>{status==="loading"?"Decoding...":"Retrieve File"}</button>
        </div>
        {logs.length>0&&(<div className="card" style={{maxWidth:"520px"}}>
          <div style={{fontSize:"12px",fontWeight:"700",color:"#9a8fc0",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px"}}>Process log</div>
          {logs.map((l,i)=><div key={i} style={{fontFamily:"var(--font-mono)",fontSize:"13px",fontWeight:"500",padding:"2px 0",color:l.startsWith("✓")?"#22c55e":l.startsWith("✗")?"#ef4444":"#c4b5fd"}}>▸ {l}</div>)}
        </div>)}
      </div>
    </div>
  );
}
export default Retrieve;
