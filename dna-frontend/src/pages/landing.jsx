import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

/* ═══════════════════════════════════════════
   CONNECTED NODE MESH BACKGROUND
   Floating nodes that link when near each other
   ═══════════════════════════════════════════ */
function NodeMesh() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, nodes = [], raf;
    const colors = ["#a29bfe", "#48dbfb", "#f0932b", "#c4b5fd"];
    const connectDist = 120;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = Math.max(document.body.scrollHeight, window.innerHeight * 3);
    }

    function init() {
      resize();
      nodes = [];
      const count = Math.floor((W * H) / 18000);
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: 1.5 + Math.random() * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 0.15 + Math.random() * 0.2,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectDist) {
            const alpha = (1 - dist / connectDist) * 0.06;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(162,155,254,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -10) n.x = W + 10;
        if (n.x > W + 10) n.x = -10;
        if (n.y < -10) n.y = H + 10;
        if (n.y > H + 10) n.y = -10;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = n.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener("resize", init);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", init); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

/* ═══════════════════════════════════════════
   INTERACTIVE DNA HELIX
   ═══════════════════════════════════════════ */
function DNAHelix() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 240, H = 360;
    canvas.width = W * 2; canvas.height = H * 2;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.scale(2, 2);

    const bases = ["A", "T", "G", "C", "5mC", "6mA"];
    const cL = ["#a29bfe", "#f0932b", "#48dbfb", "#a29bfe", "#c4b5fd", "#f0932b"];
    const cR = ["#48dbfb", "#a29bfe", "#f0932b", "#48dbfb", "#f0932b", "#a29bfe"];
    const numRungs = 14, spacing = 22, cx = W / 2, baseR = 55;
    let offset = 0, raf;

    const onMove = (e) => { const r = canvas.getBoundingClientRect(); mouseRef.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, active: true }; };
    const onLeave = () => { mouseRef.current.active = false; };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const mx = mouseRef.current.active ? (mouseRef.current.x - 0.5) * 22 : 0;
      const my = mouseRef.current.active ? (mouseRef.current.y - 0.5) * 8 : 0;
      const radiusX = baseR + mx;

      const rungs = [];
      for (let i = 0; i < numRungs; i++) {
        const y = 18 + i * spacing + my * Math.sin(i * 0.5);
        const angle = (i * 0.52) + offset;
        rungs.push({ i, y, x1: cx + Math.sin(angle) * radiusX, x2: cx - Math.sin(angle) * radiusX, depth: Math.cos(angle) });
      }

      const sorted = [...rungs].sort((a, b) => a.depth - b.depth);

      for (const { i, y, x1, x2, depth } of sorted) {
        const alpha = 0.25 + Math.abs(depth) * 0.75;
        const bIdx = i % bases.length;
        const r = 14;

        // Connection
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y);
        ctx.strokeStyle = `rgba(30,26,46,${alpha * 0.6})`; ctx.lineWidth = 1; ctx.stroke();

        // H-bond dots
        for (let d = 1; d <= 3; d++) {
          const t = d / 4;
          ctx.beginPath(); ctx.arc(x1 + (x2 - x1) * t, y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(162,155,254,${alpha * 0.25})`; ctx.fill();
        }

        // Left base
        ctx.beginPath(); ctx.arc(x1, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(26,21,40,${alpha})`; ctx.fill();
        ctx.strokeStyle = cL[bIdx] + Math.round(alpha * 50).toString(16).padStart(2, "0");
        ctx.lineWidth = 1.5; ctx.stroke();
        if (depth > 0.3) { ctx.beginPath(); ctx.arc(x1, y, r + 4, 0, Math.PI * 2); ctx.strokeStyle = cL[bIdx] + "12"; ctx.lineWidth = 3; ctx.stroke(); }
        ctx.globalAlpha = alpha; ctx.font = "600 10px 'Unbounded', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = cL[bIdx]; ctx.fillText(bases[bIdx], x1, y + 0.5); ctx.globalAlpha = 1;

        // Right base
        ctx.beginPath(); ctx.arc(x2, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(26,21,40,${alpha})`; ctx.fill();
        ctx.strokeStyle = cR[bIdx] + Math.round(alpha * 50).toString(16).padStart(2, "0");
        ctx.lineWidth = 1.5; ctx.stroke();
        if (depth > 0.3) { ctx.beginPath(); ctx.arc(x2, y, r + 4, 0, Math.PI * 2); ctx.strokeStyle = cR[bIdx] + "12"; ctx.lineWidth = 3; ctx.stroke(); }
        ctx.globalAlpha = alpha; ctx.fillStyle = cR[bIdx]; ctx.fillText(bases[(bIdx + 3) % bases.length], x2, y + 0.5); ctx.globalAlpha = 1;
      }

      // Strand curves
      for (const side of ["left", "right"]) {
        ctx.beginPath(); let started = false;
        for (const { y, x1, x2, depth } of rungs) {
          if (depth >= 0) { const x = side === "left" ? x1 : x2; if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y); }
        }
        ctx.strokeStyle = side === "left" ? "#a29bfe28" : "#48dbfb28"; ctx.lineWidth = 2; ctx.stroke();
      }

      offset += 0.008;
      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => { cancelAnimationFrame(raf); canvas.removeEventListener("mousemove", onMove); canvas.removeEventListener("mouseleave", onLeave); };
  }, []);

  return <canvas ref={canvasRef} style={{ display: "block", cursor: "crosshair" }} />;
}

/* ═══════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════ */
function Landing() {
  const navigate = useNavigate();

  const features = [
    { icon: "🧬", title: "DNA Encoding", desc: "Files compressed, fragmented, and encoded into synthetic DNA using 4-base or 6-base epigenetic encoding with +29% density.", color: "#a29bfe" },
    { icon: "🔐", title: "Blockchain Verified", desc: "Every file registered on a blockchain with Merkle tree verification for tamper-proof integrity.", color: "#f0932b" },
    { icon: "🛡️", title: "Reed-Solomon ECC", desc: "Industrial-grade error correction — the same technology in QR codes and deep-space communication.", color: "#48dbfb" },
    { icon: "🔬", title: "Constraint-Optimized", desc: "DNA sequences auto-balanced for GC content and homopolymer prevention for real-world synthesis.", color: "#c4b5fd" },
  ];

  const steps = [
    { n: "01", title: "Upload", desc: "Drop any file — docs, images, videos, archives", color: "#a29bfe" },
    { n: "02", title: "Encode", desc: "Compressed, Reed-Solomon protected, DNA encoded", color: "#48dbfb" },
    { n: "03", title: "Store", desc: "Fragments stored with blockchain registration", color: "#f0932b" },
    { n: "04", title: "Retrieve", desc: "Decode and download anytime with your key", color: "#c4b5fd" },
  ];

  return (
    <div style={{ background: "#0a0912", minHeight: "100vh", color: "#e0daf0", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
        .fu { opacity:0; animation: fadeUp 0.7s ease forwards; }
        .fu1 { animation-delay:0.15s } .fu2 { animation-delay:0.3s } .fu3 { animation-delay:0.45s } .fu4 { animation-delay:0.6s }
        .vbtn { padding:12px 28px; border-radius:6px; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s; border:none; font-family:'Outfit',sans-serif; }
        .vbtn:hover { transform:translateY(-2px); }
        .fcard { transition: all 0.25s ease; }
        .fcard:hover { transform:translateY(-4px); border-color:#2e2840 !important; background:#16132a !important; }
        .step-card { position:relative; overflow:hidden; }
        .step-card::before { content:''; position:absolute; top:0; left:0; width:100%; height:2px; background:var(--c); transform:scaleX(0); transform-origin:left; transition:transform 0.4s ease; }
        .step-card:hover::before { transform:scaleX(1); }
      `}</style>

      {/* Node mesh background */}
      <NodeMesh />

      {/* Glass nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", background: "rgba(10,9,18,0.8)", borderBottom: "1px solid #1e1a2e" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 40px", maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ fontSize: "16px", fontWeight: "700", fontFamily: "'Unbounded',sans-serif", letterSpacing: "0.5px" }}>
            <span style={{ color: "#a29bfe" }}>DNA</span> <span style={{ color: "#5a5078" }}>VAULT</span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => navigate("/login")} className="vbtn" style={{ background: "transparent", color: "#5a5078", border: "1px solid #1e1a2e" }}>Sign in</button>
            <button onClick={() => navigate("/register")} className="vbtn" style={{ background: "#a29bfe", color: "#0a0912" }}>Get started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "70px 40px 60px", display: "flex", alignItems: "center", gap: "40px", position: "relative", zIndex: 1 }}>
        <div style={{ flex: 1 }}>
          <div className="fu fu1" style={{ display: "inline-block", padding: "5px 14px", borderRadius: "20px", background: "#1a1528", border: "1px solid rgba(162,155,254,0.2)", fontSize: "11px", color: "#a29bfe", letterSpacing: "1.5px", fontFamily: "'JetBrains Mono',monospace" }}>
            BIO-DIGITAL ARCHIVAL
          </div>
          <h1 className="fu fu2" style={{ fontSize: "clamp(30px,4.5vw,48px)", fontWeight: "800", lineHeight: "1.15", letterSpacing: "-0.5px", marginTop: "20px", marginBottom: "18px", fontFamily: "'Unbounded',sans-serif" }}>
            Archiving data in<br /><span style={{ color: "#48dbfb" }}>living molecules</span>
          </h1>
          <p className="fu fu3" style={{ fontSize: "16px", color: "#5a5078", lineHeight: "1.8", maxWidth: "440px", marginBottom: "30px" }}>
            Encode any file into synthetic DNA sequences with blockchain verification, Reed-Solomon error correction, and synthesis-ready constraints.
          </p>
          <div className="fu fu4" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/register")} className="vbtn" style={{ background: "#a29bfe", color: "#0a0912", padding: "14px 32px" }}>Start encoding</button>
            <button onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })} className="vbtn" style={{ background: "transparent", color: "#5a5078", border: "1px solid #1e1a2e" }}>How it works ↓</button>
          </div>
          <div className="fu fu4" style={{ display: "flex", gap: "32px", marginTop: "48px" }}>
            {[["2.0–2.58", "bits per base", "#a29bfe"], ["Reed-Solomon", "error correction", "#48dbfb"], ["Blockchain", "verified integrity", "#f0932b"]].map(([v, l, c]) => (
              <div key={l}><div style={{ fontSize: "16px", fontWeight: "700", color: c, fontFamily: "'Unbounded',sans-serif" }}>{v}</div><div style={{ fontSize: "11px", color: "#3a3458", marginTop: "3px", fontFamily: "'JetBrains Mono',monospace" }}>{l}</div></div>
            ))}
          </div>
        </div>

        {/* Interactive helix */}
        <div className="fu fu3" style={{ flex: "0 0 240px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ borderRadius: "16px", background: "#0e0c18", border: "1px solid #1e1a2e", overflow: "hidden", position: "relative" }}>
            <DNAHelix />
            <div style={{ position: "absolute", bottom: "10px", left: 0, right: 0, textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", color: "#3a3458", letterSpacing: "1px", animation: "pulse 3s ease infinite" }}>
              hover to interact
            </div>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "#3a3458", marginTop: "14px", letterSpacing: "2px" }}>
            A · T · G · C · 5mC · 6mA
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 40px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: "700", marginBottom: "10px", fontFamily: "'Unbounded',sans-serif" }}>How it works</h2>
          <p style={{ fontSize: "14px", color: "#5a5078" }}>Four steps from file to DNA-encoded storage</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
          {steps.map((s) => (
            <div key={s.n} className="step-card" style={{ "--c": s.color, padding: "24px 20px", background: "#12101e", borderRadius: "10px", border: "1px solid #1e1a2e", cursor: "default", transition: "all 0.2s" }}>
              <div style={{ fontSize: "28px", fontWeight: "800", color: s.color + "15", fontFamily: "'Unbounded',sans-serif", marginBottom: "8px" }}>{s.n}</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: s.color, marginBottom: "6px", fontFamily: "'Unbounded',sans-serif" }}>{s.title}</div>
              <div style={{ fontSize: "13px", color: "#5a5078", lineHeight: "1.6" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 40px 80px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: "700", marginBottom: "10px", fontFamily: "'Unbounded',sans-serif" }}>Built for real-world DNA storage</h2>
          <p style={{ fontSize: "14px", color: "#5a5078" }}>Every feature meets biological and digital constraints</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
          {features.map((f) => (
            <div key={f.title} className="fcard" style={{ padding: "24px", background: "#12101e", borderRadius: "10px", border: "1px solid #1e1a2e", cursor: "default" }}>
              <div style={{ fontSize: "24px", marginBottom: "12px" }}>{f.icon}</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: f.color, marginBottom: "6px", fontFamily: "'Unbounded',sans-serif" }}>{f.title}</div>
              <div style={{ fontSize: "13px", color: "#5a5078", lineHeight: "1.7" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Encoding modes */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 40px 80px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: "700", marginBottom: "10px", fontFamily: "'Unbounded',sans-serif" }}>Two encoding modes</h2>
          <p style={{ fontSize: "14px", color: "#5a5078" }}>Choose the right encoding for your needs</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", maxWidth: "800px", margin: "0 auto" }}>
          {[
            { name: "4-Base Standard", bases: "A · T · G · C", density: "2.0 bits/base", platform: "All platforms", badge: "Ready now", color: "#a29bfe" },
            { name: "6-Base Epigenetic", bases: "A · T · G · C · 5mC · 6mA", density: "2.58 bits/base", platform: "Nanopore only", badge: "Future-ready", color: "#f0932b" },
          ].map((e) => (
            <div key={e.name} style={{ padding: "24px", background: "#12101e", borderRadius: "10px", border: "1px solid #1e1a2e" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: e.color, fontFamily: "'Unbounded',sans-serif" }}>{e.name}</div>
                <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "10px", fontWeight: "600", background: `${e.color}18`, color: e.color }}>{e.badge}</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "12px", color: "#5a5078", marginBottom: "14px" }}>{e.bases}</div>
              <div style={{ display: "flex", gap: "20px", fontSize: "12px" }}>
                <span><span style={{ color: "#3a3458" }}>Density: </span><span style={{ color: "#e0daf0", fontWeight: "500" }}>{e.density}</span></span>
                <span><span style={{ color: "#3a3458" }}>Platform: </span><span style={{ color: "#e0daf0", fontWeight: "500" }}>{e.platform}</span></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: "700px", margin: "0 auto", padding: "0 40px 80px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ padding: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #1a1528, #12101e)", border: "1px solid #2e2840", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(162,155,254,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "12px", fontFamily: "'Unbounded',sans-serif", position: "relative" }}>Ready to archive your first file?</h2>
          <p style={{ fontSize: "14px", color: "#5a5078", marginBottom: "26px", position: "relative" }}>Create a free account and start storing data in DNA today.</p>
          <button onClick={() => navigate("/register")} className="vbtn" style={{ background: "#a29bfe", color: "#0a0912", padding: "14px 36px", fontSize: "15px", position: "relative" }}>
            Get started — it's free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #1e1a2e", padding: "20px 40px", maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: "12px", color: "#3a3458", fontFamily: "'JetBrains Mono',monospace" }}>DNA Vault — Bio-Digital Archival</div>
        <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
          <span style={{ color: "#5a5078", cursor: "pointer" }} onClick={() => navigate("/login")}>Sign in</span>
          <span style={{ color: "#5a5078", cursor: "pointer" }} onClick={() => navigate("/register")}>Register</span>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
