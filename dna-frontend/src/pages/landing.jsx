import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

function NodeMesh(){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;const ctx=c.getContext("2d");let W,H,nodes=[],raf;
    const colors=["#a29bfe","#48dbfb","#f0932b","#c4b5fd"];const dist=120;
    function resize(){W=c.width=window.innerWidth;H=c.height=Math.max(document.body.scrollHeight,window.innerHeight*3)}
    function init(){resize();nodes=[];const n=Math.floor((W*H)/18000);for(let i=0;i<n;i++)nodes.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*0.25,vy:(Math.random()-0.5)*0.25,r:1.5+Math.random()*2,color:colors[Math.floor(Math.random()*colors.length)],alpha:0.15+Math.random()*0.2})}
    function draw(){ctx.clearRect(0,0,W,H);for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const dx=nodes[i].x-nodes[j].x,dy=nodes[i].y-nodes[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<dist){ctx.beginPath();ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y);ctx.strokeStyle=`rgba(162,155,254,${(1-d/dist)*0.08})`;ctx.lineWidth=0.5;ctx.stroke()}}
    for(const n of nodes){n.x+=n.vx;n.y+=n.vy;if(n.x<-10)n.x=W+10;if(n.x>W+10)n.x=-10;if(n.y<-10)n.y=H+10;if(n.y>H+10)n.y=-10;ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fillStyle=n.color;ctx.globalAlpha=n.alpha;ctx.fill();ctx.globalAlpha=1}raf=requestAnimationFrame(draw)}
    init();draw();window.addEventListener("resize",init);return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",init)}
  },[]);
  return <canvas ref={ref} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}} />;
}

function DNAHelix(){
  const ref=useRef(null);const mouse=useRef({x:0,y:0,a:false});
  useEffect(()=>{
    const c=ref.current;if(!c)return;const ctx=c.getContext("2d");const W=240,H=360;c.width=W*2;c.height=H*2;c.style.width=W+"px";c.style.height=H+"px";ctx.scale(2,2);
    const bases=["A","T","G","C","5mC","6mA"],cL=["#a29bfe","#f0932b","#48dbfb","#a29bfe","#c4b5fd","#f0932b"],cR=["#48dbfb","#a29bfe","#f0932b","#48dbfb","#f0932b","#a29bfe"];
    const num=14,sp=22,cx=W/2,bR=55;let off=0,raf;
    const onM=e=>{const r=c.getBoundingClientRect();mouse.current={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,a:true}};
    const onL=()=>{mouse.current.a=false};c.addEventListener("mousemove",onM);c.addEventListener("mouseleave",onL);
    function draw(){ctx.clearRect(0,0,W,H);const mx=mouse.current.a?(mouse.current.x-0.5)*22:0,my=mouse.current.a?(mouse.current.y-0.5)*8:0,rx=bR+mx;
    const rungs=[];for(let i=0;i<num;i++){const y=18+i*sp+my*Math.sin(i*0.5),a=(i*0.52)+off;rungs.push({i,y,x1:cx+Math.sin(a)*rx,x2:cx-Math.sin(a)*rx,d:Math.cos(a)})}
    const sorted=[...rungs].sort((a,b)=>a.d-b.d);
    for(const{i,y,x1,x2,d}of sorted){const al=0.25+Math.abs(d)*0.75,bi=i%6,r=14;
    ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.strokeStyle=`rgba(42,36,64,${al*0.6})`;ctx.lineWidth=1;ctx.stroke();
    for(let dd=1;dd<=3;dd++){const t=dd/4;ctx.beginPath();ctx.arc(x1+(x2-x1)*t,y,1.2,0,Math.PI*2);ctx.fillStyle=`rgba(162,155,254,${al*0.3})`;ctx.fill()}
    ctx.beginPath();ctx.arc(x1,y,r,0,Math.PI*2);ctx.fillStyle=`rgba(26,21,40,${al})`;ctx.fill();ctx.strokeStyle=cL[bi]+Math.round(al*50).toString(16).padStart(2,"0");ctx.lineWidth=1.5;ctx.stroke();
    if(d>0.3){ctx.beginPath();ctx.arc(x1,y,r+4,0,Math.PI*2);ctx.strokeStyle=cL[bi]+"12";ctx.lineWidth=3;ctx.stroke()}
    ctx.globalAlpha=al;ctx.font="600 10px 'Unbounded',sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=cL[bi];ctx.fillText(bases[bi],x1,y+0.5);ctx.globalAlpha=1;
    ctx.beginPath();ctx.arc(x2,y,r,0,Math.PI*2);ctx.fillStyle=`rgba(26,21,40,${al})`;ctx.fill();ctx.strokeStyle=cR[bi]+Math.round(al*50).toString(16).padStart(2,"0");ctx.lineWidth=1.5;ctx.stroke();
    if(d>0.3){ctx.beginPath();ctx.arc(x2,y,r+4,0,Math.PI*2);ctx.strokeStyle=cR[bi]+"12";ctx.lineWidth=3;ctx.stroke()}
    ctx.globalAlpha=al;ctx.fillStyle=cR[bi];ctx.fillText(bases[(bi+3)%6],x2,y+0.5);ctx.globalAlpha=1}
    for(const side of["l","r"]){ctx.beginPath();let s=false;for(const{y,x1,x2,d}of rungs){if(d>=0){const x=side==="l"?x1:x2;if(!s){ctx.moveTo(x,y);s=true}else ctx.lineTo(x,y)}}ctx.strokeStyle=side==="l"?"#a29bfe30":"#48dbfb30";ctx.lineWidth=2;ctx.stroke()}
    off+=0.008;raf=requestAnimationFrame(draw)}
    draw();return()=>{cancelAnimationFrame(raf);c.removeEventListener("mousemove",onM);c.removeEventListener("mouseleave",onL)}
  },[]);
  return <canvas ref={ref} style={{display:"block",cursor:"crosshair"}} />;
}

function Landing(){
  const nav=useNavigate();
  const features=[
    {icon:"🧬",title:"DNA Encoding",desc:"Files compressed, fragmented, and encoded into synthetic DNA using 4-base or 6-base epigenetic encoding with +29% density.",color:"#a29bfe"},
    {icon:"🔐",title:"Blockchain Verified",desc:"Every file registered on a blockchain with Merkle tree verification for tamper-proof integrity.",color:"#f0932b"},
    {icon:"🛡️",title:"Reed-Solomon ECC",desc:"Industrial-grade error correction — the same technology in QR codes and deep-space communication.",color:"#48dbfb"},
    {icon:"🔬",title:"Constraint-Optimized",desc:"DNA sequences auto-balanced for GC content and homopolymer prevention for real-world synthesis.",color:"#c4b5fd"},
  ];
  const steps=[
    {n:"01",title:"Upload",desc:"Drop any file — docs, images, videos, archives",color:"#a29bfe"},
    {n:"02",title:"Encode",desc:"Compressed, Reed-Solomon protected, DNA encoded",color:"#48dbfb"},
    {n:"03",title:"Store",desc:"Fragments stored with blockchain registration",color:"#f0932b"},
    {n:"04",title:"Retrieve",desc:"Decode and download anytime with your key",color:"#c4b5fd"},
  ];

  return(
    <div style={{background:"#0a0912",minHeight:"100vh",color:"#f0ecf8",position:"relative",overflow:"hidden"}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}
        .fu{opacity:0;animation:fadeUp 0.7s ease forwards}
        .fu1{animation-delay:.15s}.fu2{animation-delay:.3s}.fu3{animation-delay:.45s}.fu4{animation-delay:.6s}
        .vbtn{padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;border:none;font-family:'Outfit',sans-serif}
        .vbtn:hover{transform:translateY(-2px)}
        .fcard{transition:all 0.25s ease}.fcard:hover{transform:translateY(-4px);border-color:#2e2840!important;background:#16132a!important}
        .step-card{position:relative;overflow:hidden}.step-card::before{content:'';position:absolute;top:0;left:0;width:100%;height:2px;background:var(--c);transform:scaleX(0);transform-origin:left;transition:transform 0.4s ease}.step-card:hover::before{transform:scaleX(1)}
      `}</style>

      <NodeMesh />

      <nav style={{position:"sticky",top:0,zIndex:10,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",background:"rgba(10,9,18,0.8)",borderBottom:"1px solid #2a2440"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 40px",maxWidth:"1100px",margin:"0 auto"}}>
          <div style={{fontSize:"16px",fontWeight:"800",fontFamily:"'Unbounded',sans-serif",letterSpacing:"0.5px"}}>
            <span style={{color:"#a29bfe"}}>DNA</span> <span style={{color:"#9a8fc0"}}>VAULT</span>
          </div>
          <div style={{display:"flex",gap:"10px"}}>
            <button onClick={()=>nav("/login")} className="vbtn" style={{background:"transparent",color:"#9a8fc0",border:"1px solid #2a2440"}}>Sign in</button>
            <button onClick={()=>nav("/register")} className="vbtn" style={{background:"#a29bfe",color:"#0a0912"}}>Get started</button>
          </div>
        </div>
      </nav>

      <section style={{maxWidth:"1100px",margin:"0 auto",padding:"70px 40px 60px",display:"flex",alignItems:"center",gap:"40px",position:"relative",zIndex:1}}>
        <div style={{flex:1}}>
          <div className="fu fu1" style={{display:"inline-block",padding:"5px 14px",borderRadius:"20px",background:"#1a1528",border:"1px solid rgba(162,155,254,0.25)",fontSize:"11px",color:"#c4b5fd",letterSpacing:"1.5px",fontFamily:"'JetBrains Mono',monospace",fontWeight:"600"}}>BIO-DIGITAL ARCHIVAL</div>
          <h1 className="fu fu2" style={{fontSize:"clamp(30px,4.5vw,48px)",fontWeight:"800",lineHeight:"1.15",letterSpacing:"-0.5px",marginTop:"20px",marginBottom:"18px",fontFamily:"'Unbounded',sans-serif"}}>
            Archiving data in<br /><span style={{color:"#48dbfb"}}>living molecules</span>
          </h1>
          <p className="fu fu3" style={{fontSize:"16px",color:"#9a8fc0",lineHeight:"1.8",maxWidth:"440px",marginBottom:"30px",fontWeight:"500"}}>
            Encode any file into synthetic DNA sequences with blockchain verification, Reed-Solomon error correction, and synthesis-ready constraints.
          </p>
          <div className="fu fu4" style={{display:"flex",gap:"12px",flexWrap:"wrap"}}>
            <button onClick={()=>nav("/register")} className="vbtn" style={{background:"#a29bfe",color:"#0a0912",padding:"14px 32px"}}>Start encoding</button>
            <button onClick={()=>document.getElementById("how")?.scrollIntoView({behavior:"smooth"})} className="vbtn" style={{background:"transparent",color:"#9a8fc0",border:"1px solid #2a2440"}}>How it works ↓</button>
          </div>
          <div className="fu fu4" style={{display:"flex",gap:"32px",marginTop:"48px"}}>
            {[["2.0–2.58","bits per base","#a29bfe"],["Reed-Solomon","error correction","#48dbfb"],["Blockchain","verified integrity","#f0932b"]].map(([v,l,c])=>(
              <div key={l}><div style={{fontSize:"16px",fontWeight:"800",color:c,fontFamily:"'Unbounded',sans-serif"}}>{v}</div><div style={{fontSize:"11px",color:"#9a8fc0",marginTop:"3px",fontFamily:"'JetBrains Mono',monospace",fontWeight:"500"}}>{l}</div></div>
            ))}
          </div>
        </div>
        <div className="fu fu3" style={{flex:"0 0 240px",display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{borderRadius:"16px",background:"#0e0c18",border:"1px solid #2a2440",overflow:"hidden",position:"relative"}}>
            <DNAHelix />
            <div style={{position:"absolute",bottom:"10px",left:0,right:0,textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:"9px",color:"#6b5f8a",letterSpacing:"1px",animation:"pulse 3s ease infinite",fontWeight:"500"}}>hover to interact</div>
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:"#6b5f8a",marginTop:"14px",letterSpacing:"2px",fontWeight:"500"}}>A · T · G · C · 5mC · 6mA</div>
        </div>
      </section>

      <section id="how" style={{maxWidth:"1100px",margin:"0 auto",padding:"80px 40px",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:"44px"}}>
          <h2 style={{fontSize:"26px",fontWeight:"700",marginBottom:"10px",fontFamily:"'Unbounded',sans-serif"}}>How it works</h2>
          <p style={{fontSize:"14px",color:"#9a8fc0",fontWeight:"500"}}>Four steps from file to DNA-encoded storage</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"14px"}}>
          {steps.map(s=>(
            <div key={s.n} className="step-card" style={{"--c":s.color,padding:"24px 20px",background:"#12101e",borderRadius:"10px",border:"1px solid #2a2440",cursor:"default",transition:"all 0.2s"}}>
              <div style={{fontSize:"28px",fontWeight:"800",color:s.color+"20",fontFamily:"'Unbounded',sans-serif",marginBottom:"8px"}}>{s.n}</div>
              <div style={{fontSize:"14px",fontWeight:"700",color:s.color,marginBottom:"6px",fontFamily:"'Unbounded',sans-serif"}}>{s.title}</div>
              <div style={{fontSize:"13px",color:"#9a8fc0",lineHeight:"1.6",fontWeight:"500"}}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{maxWidth:"1100px",margin:"0 auto",padding:"40px 40px 80px",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:"44px"}}>
          <h2 style={{fontSize:"26px",fontWeight:"700",marginBottom:"10px",fontFamily:"'Unbounded',sans-serif"}}>Built for real-world DNA storage</h2>
          <p style={{fontSize:"14px",color:"#9a8fc0",fontWeight:"500"}}>Every feature meets biological and digital constraints</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"14px"}}>
          {features.map(f=>(
            <div key={f.title} className="fcard" style={{padding:"24px",background:"#12101e",borderRadius:"10px",border:"1px solid #2a2440",cursor:"default"}}>
              <div style={{fontSize:"24px",marginBottom:"12px"}}>{f.icon}</div>
              <div style={{fontSize:"14px",fontWeight:"700",color:f.color,marginBottom:"6px",fontFamily:"'Unbounded',sans-serif"}}>{f.title}</div>
              <div style={{fontSize:"13px",color:"#9a8fc0",lineHeight:"1.7",fontWeight:"500"}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{maxWidth:"1100px",margin:"0 auto",padding:"0 40px 80px",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:"36px"}}>
          <h2 style={{fontSize:"26px",fontWeight:"700",marginBottom:"10px",fontFamily:"'Unbounded',sans-serif"}}>Two encoding modes</h2>
          <p style={{fontSize:"14px",color:"#9a8fc0",fontWeight:"500"}}>Choose the right encoding for your needs</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",maxWidth:"800px",margin:"0 auto"}}>
          {[{name:"4-Base Standard",bases:"A · T · G · C",density:"2.0 bits/base",platform:"All platforms",badge:"Ready now",color:"#a29bfe"},
            {name:"6-Base Epigenetic",bases:"A · T · G · C · 5mC · 6mA",density:"2.58 bits/base",platform:"Nanopore only",badge:"Future-ready",color:"#f0932b"}
          ].map(e=>(
            <div key={e.name} style={{padding:"24px",background:"#12101e",borderRadius:"10px",border:"1px solid #2a2440"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}>
                <div style={{fontSize:"14px",fontWeight:"700",color:e.color,fontFamily:"'Unbounded',sans-serif"}}>{e.name}</div>
                <span style={{padding:"3px 10px",borderRadius:"12px",fontSize:"11px",fontWeight:"600",background:`${e.color}18`,color:e.color}}>{e.badge}</span>
              </div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"12px",color:"#c4b5fd",marginBottom:"14px",fontWeight:"500"}}>{e.bases}</div>
              <div style={{display:"flex",gap:"20px",fontSize:"12px",fontWeight:"500"}}>
                <span style={{color:"#9a8fc0"}}><span style={{color:"#c4b5fd",fontWeight:"600"}}>Density: </span>{e.density}</span>
                <span style={{color:"#9a8fc0"}}><span style={{color:"#c4b5fd",fontWeight:"600"}}>Platform: </span>{e.platform}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{maxWidth:"700px",margin:"0 auto",padding:"0 40px 80px",textAlign:"center",position:"relative",zIndex:1}}>
        <div style={{padding:"48px",borderRadius:"14px",background:"linear-gradient(135deg,#1a1528,#12101e)",border:"1px solid #2e2840",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 30% 50%,rgba(162,155,254,0.06) 0%,transparent 70%)",pointerEvents:"none"}} />
          <h2 style={{fontSize:"22px",fontWeight:"700",marginBottom:"12px",fontFamily:"'Unbounded',sans-serif",position:"relative"}}>Ready to archive your first file?</h2>
          <p style={{fontSize:"14px",color:"#9a8fc0",marginBottom:"26px",position:"relative",fontWeight:"500"}}>Create a free account and start storing data in DNA today.</p>
          <button onClick={()=>nav("/register")} className="vbtn" style={{background:"#a29bfe",color:"#0a0912",padding:"14px 36px",fontSize:"15px",position:"relative"}}>Get started — it's free</button>
        </div>
      </section>

      <footer style={{borderTop:"1px solid #2a2440",padding:"20px 40px",maxWidth:"1100px",margin:"0 auto",display:"flex",justifyContent:"space-between",position:"relative",zIndex:1}}>
        <div style={{fontSize:"12px",color:"#6b5f8a",fontFamily:"'JetBrains Mono',monospace",fontWeight:"500"}}>DNA Vault — Bio-Digital Archival</div>
        <div style={{display:"flex",gap:"16px",fontSize:"13px",fontWeight:"600"}}>
          <span style={{color:"#9a8fc0",cursor:"pointer"}} onClick={()=>nav("/login")}>Sign in</span>
          <span style={{color:"#9a8fc0",cursor:"pointer"}} onClick={()=>nav("/register")}>Register</span>
        </div>
      </footer>
    </div>
  );
}
export default Landing;
