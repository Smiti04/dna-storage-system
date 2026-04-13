import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { uploadFile, analyzeConstraints, extractError } from "../services/api";
import DNAConstraintsPanel from "../components/DNAConstraintsPanel";

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
  const ref = useRef();
  const addLog = (m) => setLog((p) => [...p, m]);

  const doUp = async () => {
    if (!file) return;
    setStatus("uploading"); setLog([]); setCData(null); setResult(null);
    addLog(`Preparing: ${file.name}`); addLog(`Encoding: ${enc === "6base" ? "6-Base Epigenetic" : "4-Base Standard"}`); addLog("Compressing...");
    try {
      const r = await uploadFile(file, enc, (m) => addLog(m));
      if (r.data.success) {
        addLog("Reed-Solomon applied..."); addLog("DNA generated..."); addLog("Blockchain stored..."); addLog("✓ Upload complete");
        setResult(r.data); setStatus("done");
        const kc = [`FILE ID: ${r.data.file_id}`,`RETRIEVAL KEY: ${r.data.retrieval_key}`,`MERKLE ROOT: ${r.data.merkle_root}`,`ENCODING: ${r.data.encoding_type}`].join("\n");
        const b = new Blob([kc],{type:"text/plain"}); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href=u; a.download=`${file.name}_key.txt`; a.click(); URL.revokeObjectURL(u);
        addLog("Analyzing constraints..."); setAzing(true);
        try { const x = await analyzeConstraints(r.data.file_id); setCData(x.data); addLog("✓ Analysis complete"); } catch { addLog("⚠ Analysis failed"); }
        setAzing(false);
      } else { addLog(`✗ ${r.data.error}`); setStatus("error"); }
    } catch (e) { addLog(`✗ ${extractError(e,"Upload failed")}`); setStatus("error"); }
  };

  const encs = [
    {id:"4base",label:"4-Base Standard",bases:"A · T · G · C",badge:"Ready now",color:"#a29bfe",desc:"Standard DNA. All platforms.",density:"2.0 bits/base",compat:"All platforms"},
    {id:"6base",label:"6-Base Epigenetic",bases:"A · T · G · C · 5mC · 6mA",badge:"Future-ready",color:"#f0932b",desc:"Epigenetic +29% density. Nanopore only.",density:"2.58 bits/base",compat:"Nanopore only"},
  ];
  const sl = {fontSize:"12px",fontWeight:"700",color:"#9a8fc0",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px"};

  return (
    <div className="page-layout"><Sidebar />
      <div className="page-content">
        <div className="page-title">Upload File</div>
        <div className="page-subtitle">Select encoding, drop a file, encode and store</div>

        <div style={sl}>Step 1 — Encoding mode</div>
        <div style={{display:"flex",gap:"12px",marginBottom:"24px",flexWrap:"wrap"}}>
          {encs.map(e=>(
            <div key={e.id} onClick={()=>setEnc(e.id)} style={{flex:1,minWidth:"240px",padding:"18px",background:"#12101e",border:`1.5px solid ${enc===e.id?e.color:"#2a2440"}`,borderRadius:"8px",cursor:"pointer",transition:"all 0.15s"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                <div style={{fontSize:"15px",fontWeight:"700",color:e.color}}>{e.label}</div>
                <span style={{padding:"2px 10px",borderRadius:"10px",fontSize:"11px",fontWeight:"600",background:`${e.color}18`,color:e.color}}>{e.badge}</span>
              </div>
              <div style={{fontFamily:"var(--font-mono)",fontSize:"12px",color:"#c4b5fd",fontWeight:"500",marginBottom:"8px"}}>{e.bases}</div>
              <div style={{fontSize:"13px",color:"#9a8fc0",lineHeight:"1.5",fontWeight:"500",marginBottom:"10px"}}>{e.desc}</div>
              <div style={{display:"flex",gap:"16px",fontSize:"12px",fontWeight:"500"}}>
                <span style={{color:"#9a8fc0"}}><span style={{color:"#c4b5fd",fontWeight:"600"}}>Density:</span> {e.density}</span>
                <span style={{color:"#9a8fc0"}}><span style={{color:"#c4b5fd",fontWeight:"600"}}>Platform:</span> {e.compat}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={sl}>Step 2 — Select file</div>
        <div onClick={()=>ref.current.click()} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);setFile(e.dataTransfer.files[0])}}
          style={{border:`2px dashed ${drag?"#a29bfe":file?"#22c55e":"#2a2440"}`,borderRadius:"8px",padding:"36px",textAlign:"center",cursor:"pointer",background:drag?"#1a1528":file?"#0a1a12":"#12101e",transition:"all 0.15s",marginBottom:"20px"}}>
          <div style={{fontSize:"28px",marginBottom:"8px",color:file?"#22c55e":"#6b5f8a"}}>{file?"✓":"↑"}</div>
          <div style={{fontSize:"14px",fontWeight:"600",color:file?"#22c55e":"#c4b5fd"}}>{file?file.name:"Drop file here or click to browse"}</div>
          {file&&<div style={{fontSize:"13px",color:"#9a8fc0",marginTop:"4px",fontWeight:"500"}}>{(file.size/1024).toFixed(1)} KB</div>}
          <input ref={ref} type="file" style={{display:"none"}} onChange={e=>setFile(e.target.files[0])} />
        </div>

        {file&&(<div className="card" style={{marginBottom:"20px",display:"flex",gap:"28px",flexWrap:"wrap"}}>
          {[["File",file.name],["Size",`${(file.size/1024).toFixed(1)} KB`],["Encoding",enc==="6base"?"6-Base Epigenetic":"4-Base Standard"],["Bases",enc==="6base"?"A T G C 5mC 6mA":"A T G C"]].map(([k,v])=>(
            <div key={k}><div style={{fontSize:"11px",color:"#9a8fc0",textTransform:"uppercase",marginBottom:"3px",fontWeight:"700"}}>{k}</div><div style={{fontSize:"14px",fontWeight:"600",color:"#f0ecf8"}}>{v}</div></div>
          ))}
        </div>)}

        <div style={sl}>Step 3 — Encode & store</div>
        <button className="btn-primary" onClick={doUp} disabled={!file||status==="uploading"} style={{marginBottom:"20px"}}>{status==="uploading"?"Encoding...":"Encode & Store"}</button>

        {log.length>0&&(<div className="card" style={{marginBottom:"20px"}}><div style={sl}>Process log</div>
          {log.map((l,i)=>(<div key={i} style={{fontFamily:"var(--font-mono)",fontSize:"13px",fontWeight:"500",padding:"2px 0",color:l.startsWith("✓")?"#22c55e":l.startsWith("✗")?"#ef4444":l.startsWith("⚠")?"#f0932b":"#c4b5fd"}}>▸ {l}</div>))}
        </div>)}

        {result&&(<div className="card" style={{border:"1px solid rgba(34,197,94,0.3)",marginBottom:"8px"}}>
          <div style={{fontSize:"15px",fontWeight:"700",color:"#22c55e",marginBottom:"14px"}}>✓ Storage Complete</div>
          {[["File ID",result.file_id],["Encoding",result.encoding_type==="6base"?"6-Base Epigenetic":"4-Base Standard"],["Merkle Root",result.merkle_root]].map(([k,v])=>(
            <div key={k} style={{marginBottom:"8px"}}><div style={{fontSize:"11px",color:"#9a8fc0",textTransform:"uppercase",marginBottom:"2px",fontWeight:"700"}}>{k}</div><div style={{fontSize:"13px",color:"#f0ecf8",fontFamily:"var(--font-mono)",wordBreak:"break-all",fontWeight:"500"}}>{v}</div></div>
          ))}
          <div style={{fontSize:"13px",fontWeight:"600",color:"#22c55e",marginTop:"6px"}}>✓ Retrieval key downloaded</div>
          <button className="btn-primary" style={{marginTop:"14px"}} onClick={()=>nav("/files")}>View my files</button>
        </div>)}

        {azing&&<div className="card" style={{marginTop:"20px",color:"#48dbfb",fontWeight:"600"}}>Analyzing DNA constraints...</div>}
        {cData&&<DNAConstraintsPanel data={cData} />}
      </div>
    </div>
  );
}
export default Upload;
