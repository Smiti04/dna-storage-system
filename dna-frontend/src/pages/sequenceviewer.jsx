import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getSequence } from "../services/api";

const FP="ACGTACGTAC",RP="TGCATGCATG";
const parse=(raw,idx)=>{try{const[cp,rest]=raw.split(":",2);const[ip,dna]=rest.split("|",2);const core=dna.replace(new RegExp(`^${FP}`),"").replace(new RegExp(`${RP}$`),"");return{raw,idx,chunkId:parseInt(cp),fragIndex:parseInt(ip),fp:FP,core,rp:RP,full:dna,length:dna.length};}catch{return null;}};
const copy=(t)=>navigator.clipboard.writeText(t).then(()=>alert("Copied!"));
const dl=(t,f)=>{const b=new Blob([t],{type:"text/plain"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=f;a.click();URL.revokeObjectURL(u);};

function ColoredDNA({forward,core,reverse}){
  return <span style={{fontFamily:"var(--font-mono)",fontSize:"12px",wordBreak:"break-all",lineHeight:"2"}}>
    <span style={{color:"#f0932b",background:"#1a1210",borderRadius:"2px",padding:"0 1px"}}>{forward}</span>
    <span style={{color:"#22c55e"}}>{core}</span>
    <span style={{color:"#ef4444",background:"#1a0a0a",borderRadius:"2px",padding:"0 1px"}}>{reverse}</span>
  </span>;
}

function SequenceViewer(){
  const loc=useLocation();const nav=useNavigate();
  const{fileId,filename}=loc.state||{};
  const[status,setStatus]=useState("idle");
  const[view,setView]=useState("full");
  const[frags,setFrags]=useState([]);const[full,setFull]=useState("");const[total,setTotal]=useState(0);
  const[search,setSearch]=useState("");const[exp,setExp]=useState(null);

  const fetch_=async()=>{setStatus("loading");try{const r=await getSequence(fileId);const p=r.data.fragments.map((f,i)=>parse(f,i)).filter(Boolean);setFrags(p);setTotal(r.data.total_fragments);setFull(p.map(f=>f.full).join(""));setStatus("done");}catch{setStatus("error");}};
  const filtered=frags.filter(f=>search===""||f.fragIndex.toString().includes(search)||f.chunkId.toString().includes(search)||f.full.includes(search.toUpperCase()));

  const btn=(c)=>({padding:"7px 14px",background:c,border:"none",borderRadius:"5px",color:"#fff",fontWeight:"700",cursor:"pointer",fontSize:"12px"});
  const obtn=(a)=>({padding:"7px 14px",background:a?"#a29bfe":"transparent",border:`1px solid ${a?"#a29bfe":"#2a2440"}`,borderRadius:"5px",color:a?"#0a0912":"#9a8fc0",cursor:"pointer",fontSize:"13px",fontWeight:"600"});

  return(
    <div className="page-layout"><Sidebar />
      <div className="page-content">
        <button onClick={()=>nav("/files")} style={{background:"transparent",border:"1px solid #2a2440",color:"#9a8fc0",padding:"6px 12px",borderRadius:"5px",cursor:"pointer",fontSize:"13px",fontWeight:"600",marginBottom:"18px"}}>← Back to Files</button>
        <div className="page-title">DNA Sequence Viewer</div>
        <div className="page-subtitle">{filename||fileId} · Binary → Compress → Hex → Reed-Solomon → DNA</div>

        {status==="idle"&&<div className="card"><div style={{color:"#9a8fc0",marginBottom:"12px",fontSize:"14px",fontWeight:"500"}}>Load the DNA fragments stored in the database.</div><button style={btn("#a29bfe")} onClick={fetch_}>Load DNA Sequence</button></div>}
        {status==="loading"&&<div className="card" style={{color:"#48dbfb",fontWeight:"600"}}>Fetching fragments...</div>}
        {status==="error"&&<div className="card" style={{color:"#ef4444",fontWeight:"600"}}>Failed to load sequence.</div>}

        {status==="done"&&<>
          <div style={{display:"flex",gap:"10px",marginBottom:"18px",flexWrap:"wrap"}}>
            {[["Total Fragments",total,"#a29bfe"],["Total DNA Bases",full.length.toLocaleString(),"#48dbfb"],["Encoding","2-BIT","#f0932b"],["Error Correction","Reed-Solomon","#c4b5fd"]].map(([l,v,c])=>(
              <div key={l} className="card" style={{textAlign:"center",padding:"10px 16px",flex:1,minWidth:"130px"}}>
                <div style={{fontSize:"11px",color:"#9a8fc0",textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:"700"}}>{l}</div>
                <div style={{fontSize:"18px",fontWeight:"700",color:c,marginTop:"4px"}}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{display:"flex",gap:"8px",marginBottom:"18px"}}>
            <button style={obtn(view==="full")} onClick={()=>setView("full")}>Full Sequence</button>
            <button style={obtn(view==="fragments")} onClick={()=>setView("fragments")}>Fragmented ({total})</button>
          </div>

          {view==="full"&&<div className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px",flexWrap:"wrap",gap:"8px"}}>
              <div style={{fontSize:"13px",color:"#9a8fc0",fontWeight:"600"}}>{full.length.toLocaleString()} bases</div>
              <div style={{display:"flex",gap:"6px"}}>
                <button style={btn("#48dbfb")} onClick={()=>copy(full)}>Copy</button>
                <button style={btn("#a29bfe")} onClick={()=>dl(full,`${filename||fileId}_seq.txt`)}>.txt</button>
                <button style={btn("#22c55e")} onClick={()=>dl(full,`${filename||fileId}_seq.fasta`)}>.fasta</button>
              </div>
            </div>
            <div style={{background:"#0a0912",border:"1px solid #2a2440",borderRadius:"6px",padding:"14px",maxHeight:"300px",overflowY:"auto",wordBreak:"break-all",fontSize:"12px",lineHeight:"2",color:"#22c55e",fontFamily:"var(--font-mono)",fontWeight:"500"}}>{full}</div>
          </div>}

          {view==="fragments"&&<div className="card">
            <div style={{display:"flex",gap:"10px",marginBottom:"12px",fontSize:"12px",alignItems:"center",fontWeight:"600"}}>
              <span style={{padding:"2px 8px",borderRadius:"4px",background:"#1a1210",color:"#f0932b"}}>Forward</span>
              <span style={{padding:"2px 8px",borderRadius:"4px",background:"#0a1a12",color:"#22c55e"}}>Core</span>
              <span style={{padding:"2px 8px",borderRadius:"4px",background:"#1a0a0a",color:"#ef4444"}}>Reverse</span>
            </div>
            <div style={{marginBottom:"12px",display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
              <input style={{padding:"7px 10px",background:"#0e0c18",border:"1px solid #2a2440",borderRadius:"5px",color:"#f0ecf8",fontSize:"13px",width:"240px",fontWeight:"500"}} placeholder="Search chunk, index, sequence..." value={search} onChange={e=>setSearch(e.target.value)} />
              <span style={{fontSize:"12px",color:"#9a8fc0",fontWeight:"600"}}>{filtered.length} / {total}</span>
              <button style={btn("#48dbfb")} onClick={()=>dl(frags.map(f=>f.raw).join("\n"),`${filename||fileId}_all.txt`)}>Download All</button>
            </div>
            <div style={{maxHeight:"480px",overflowY:"auto"}}>
              {filtered.map(f=>(
                <div key={f.idx} onClick={()=>setExp(exp===f.idx?null:f.idx)}
                  style={{background:exp===f.idx?"#16132a":"#12101e",border:`1px solid ${exp===f.idx?"#a29bfe33":"#2a2440"}`,borderRadius:"6px",padding:"10px 14px",marginBottom:"5px",cursor:"pointer",transition:"all 0.15s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                      <span style={{padding:"2px 6px",borderRadius:"4px",fontSize:"11px",background:"#1a1528",color:"#c4b5fd",fontWeight:"600"}}>Chunk {f.chunkId}</span>
                      <span style={{padding:"2px 6px",borderRadius:"4px",fontSize:"11px",background:"#0c1a22",color:"#48dbfb",fontWeight:"600"}}>Index {f.fragIndex}</span>
                      <span style={{fontSize:"12px",color:"#9a8fc0",fontWeight:"500"}}>{f.length} bases</span>
                    </div>
                    <span style={{fontSize:"10px",color:"#6b5f8a"}}>{ exp===f.idx?"▲":"▼"}</span>
                  </div>
                  {exp!==f.idx&&<div style={{marginTop:"5px",fontSize:"12px",color:"#6b5f8a",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",fontFamily:"var(--font-mono)",fontWeight:"500"}}>{f.full.slice(0,70)}...</div>}
                  {exp===f.idx&&<div style={{marginTop:"10px"}}>
                    <div style={{marginBottom:"8px"}}><ColoredDNA forward={f.fp} core={f.core} reverse={f.rp} /></div>
                    <div style={{display:"flex",gap:"6px"}}>
                      <button style={btn("#48dbfb")} onClick={e=>{e.stopPropagation();copy(f.full);}}>Copy</button>
                      <button style={btn("#a29bfe")} onClick={e=>{e.stopPropagation();copy(f.core);}}>Core</button>
                      <button style={btn("#22c55e")} onClick={e=>{e.stopPropagation();dl(`>c${f.chunkId}_f${f.fragIndex}\n${f.full}`,`c${f.chunkId}_f${f.fragIndex}.fasta`);}}>.fasta</button>
                    </div>
                  </div>}
                </div>
              ))}
            </div>
          </div>}
        </>}
      </div>
    </div>
  );
}
export default SequenceViewer;
