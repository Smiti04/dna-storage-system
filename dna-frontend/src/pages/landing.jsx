import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

function DNAHelix() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 220, H = 320;
    canvas.width = W * 2; canvas.height = H * 2;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.scale(2, 2);

    const bases = ["A", "T", "G", "C", "5mC", "6mA"];
    const colors = ["#a29bfe", "#48dbfb", "#f0932b", "#a29bfe", "#c4b5fd", "#48dbfb"];
    const numRungs = 12;
    const rungSpacing = 24;
    const cx = W / 2;
    const radiusX = 50;
    let offset = 0;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      const rungs = [];
      for (let i = 0; i < numRungs; i++) {
        const y = 20 + i * rungSpacing;
        const angle = (i * 0.55) + offset;
        const x1 = cx + Math.sin(angle) * radiusX;
        const x2 = cx - Math.sin(angle) * radiusX;
        const depth = Math.cos(angle);
        rungs.push({ i, y, x1, x2, depth, angle });
      }

      // Draw back strand first
      ctx.beginPath();
      ctx.strokeStyle = "#1e1a2e";
      ctx.lineWidth = 1.5;
      for (let r = 0; r < rungs.length; r++) {
        const { y, x2, depth } = rungs[r];
        if (depth < 0) {
          if (r === 0) ctx.moveTo(x2, y);
          else ctx.lineTo(x2, y);
        }
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = "#1e1a2e";
      ctx.lineWidth = 1.5;
      for (let r = 0; r < rungs.length; r++) {
        const { y, x1, depth } = rungs[r];
        if (depth < 0) {
          if (r === 0) ctx.moveTo(x1, y);
          else ctx.lineTo(x1, y);
        }
      }
      ctx.stroke();

      // Draw rungs and bases
      for (const { i, y, x1, x2, depth } of rungs) {
        const alpha = 0.3 + Math.abs(depth) * 0.7;
        const bIdx = i % bases.length;
        const bIdx2 = (i + 3) % bases.length;
        const c1 = colors[bIdx];
        const c2 = colors[bIdx2];

        // Rung line
        ctx.beginPath();
        ctx.strokeStyle = `rgba(30,26,46,${alpha})`;
        ctx.lineWidth = 1;
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();

        // Hydrogen bonds (dashes in middle)
        const mx = (x1 + x2) / 2;
        for (let d = -6; d <= 6; d += 6) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(90,80,120,${alpha * 0.4})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(mx + d - 2, y);
          ctx.lineTo(mx + d + 2, y);
          ctx.stroke();
        }

        // Base circles
        const r = 13;
        // Left base
        ctx.beginPath();
        ctx.arc(x1, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(26,21,40,${alpha})`;
        ctx.fill();
        ctx.strokeStyle = c1 + Math.round(alpha * 60).toString(16).padStart(2, "0");
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = c1;
        ctx.globalAlpha = alpha;
        ctx.font = "500 10px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(bases[bIdx], x1, y + 0.5);

        // Right base
        ctx.beginPath();
        ctx.arc(x2, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(26,21,40,${alpha})`;
        ctx.globalAlpha = 1;
        ctx.fill();
        ctx.strokeStyle = c2 + Math.round(alpha * 60).toString(16).padStart(2, "0");
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = c2;
        ctx.globalAlpha = alpha;
        ctx.font = "500 10px 'Outfit', sans-serif";
        ctx.fillText(bases[bIdx2], x2, y + 0.5);
        ctx.globalAlpha = 1;
      }

      // Front strands
      // Left strand
      ctx.beginPath();
      ctx.lineWidth = 2;
      let started = false;
      for (let r = 0; r < rungs.length; r++) {
        const { y, x1, depth } = rungs[r];
        if (depth >= 0) {
          if (!started) { ctx.moveTo(x1, y); started = true; }
          else ctx.lineTo(x1, y);
        }
      }
      ctx.strokeStyle = "#a29bfe55";
      ctx.stroke();

      // Right strand
      ctx.beginPath();
      started = false;
      for (let r = 0; r < rungs.length; r++) {
        const { y, x2, depth } = rungs[r];
        if (depth >= 0) {
          if (!started) { ctx.moveTo(x2, y); started = true; }
          else ctx.lineTo(x2, y);
        }
      }
      ctx.strokeStyle = "#48dbfb55";
      ctx.stroke();

      offset += 0.012;
      requestAnimationFrame(draw);
    }

    const raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
}

function Landing() {
  const navigate = useNavigate();

  const features = [
    { icon: "🧬", title: "DNA Encoding", desc: "Files compressed, fragmented, and encoded into synthetic DNA using 4-base or 6-base epigenetic encoding with +29% density.", color: "#a29bfe" },
    { icon: "🔐", title: "Blockchain Verified", desc: "Every file registered on a blockchain with Merkle tree verification for tamper-proof integrity.", color: "#f0932b" },
    { icon: "🛡️", title: "Reed-Solomon ECC", desc: "Industrial-grade error correction — the same technology used in QR codes and deep-space communication.", color: "#48dbfb" },
    { icon: "🔬", title: "Constraint-Optimized", desc: "DNA sequences auto-balanced for GC content and homopolymer prevention for real-world synthesis.", color: "#a29bfe" },
  ];

  const steps = [
    { n: "01", title: "Upload", desc: "Drop any file — docs, images, videos", color: "#a29bfe" },
    { n: "02", title: "Encode", desc: "Compressed and encoded into DNA", color: "#48dbfb" },
    { n: "03", title: "Store", desc: "Fragments stored, blockchain-registered", color: "#f0932b" },
    { n: "04", title: "Retrieve", desc: "Decode and download with your key", color: "#a29bfe" },
  ];

  return (
    <div style={{ background: "#0a0912", minHeight: "100vh", color: "#e0daf0" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fu { opacity:0; animation: fadeUp 0.6s ease forwards; }
        .fu1 { animation-delay:0.1s } .fu2 { animation-delay:0.2s } .fu3 { animation-delay:0.35s } .fu4 { animation-delay:0.5s }
        .vbtn { padding:12px 28px; border-radius:6px; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s; border:none; font-family:'Outfit',sans-serif; }
        .vbtn:hover { transform:translateY(-2px); }
        .fcard:hover { transform:translateY(-3px); border-color:#2e2840 !important; }
      `}</style>

      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 40px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ fontSize: "16px", fontWeight: "600", letterSpacing: "2px" }}>
          <span style={{ color: "#a29bfe" }}>DNA</span> <span style={{ color: "#5a5078" }}>VAULT</span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => navigate("/login")} className="vbtn" style={{ background: "transparent", color: "#5a5078", border: "1px solid #1e1a2e" }}>Sign in</button>
          <button onClick={() => navigate("/register")} className="vbtn" style={{ background: "#a29bfe", color: "#0a0912" }}>Get started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 40px 60px", display: "flex", alignItems: "center", gap: "40px" }}>
        <div style={{ flex: 1 }}>
          <div className="fu fu1" style={{ display: "inline-block", padding: "5px 14px", borderRadius: "20px", background: "#1a1528", border: "1px solid rgba(162,155,254,0.2)", fontSize: "11px", color: "#a29bfe", letterSpacing: "1px", marginBottom: "18px" }}>
            BIO-DIGITAL ARCHIVAL
          </div>
          <h1 className="fu fu2" style={{ fontSize: "clamp(32px,5vw,50px)", fontWeight: "700", lineHeight: "1.15", letterSpacing: "-0.5px", marginBottom: "16px", fontFamily: "'Outfit',sans-serif" }}>
            Archiving data in<br /><span style={{ color: "#48dbfb" }}>living molecules</span>
          </h1>
          <p className="fu fu3" style={{ fontSize: "16px", color: "#5a5078", lineHeight: "1.7", maxWidth: "440px", marginBottom: "28px" }}>
            Encode any file into synthetic DNA sequences with blockchain verification, Reed-Solomon error correction, and synthesis-ready constraints.
          </p>
          <div className="fu fu4" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/register")} className="vbtn" style={{ background: "#a29bfe", color: "#0a0912", padding: "14px 32px" }}>Start encoding</button>
            <button onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })} className="vbtn" style={{ background: "transparent", color: "#5a5078", border: "1px solid #1e1a2e" }}>How it works ↓</button>
          </div>
          <div className="fu fu4" style={{ display: "flex", gap: "32px", marginTop: "44px" }}>
            {[["2.0–2.58", "bits per base", "#a29bfe"], ["Reed-Solomon", "error correction", "#48dbfb"], ["Blockchain", "verified integrity", "#f0932b"]].map(([v, l, c]) => (
              <div key={l}><div style={{ fontSize: "18px", fontWeight: "600", color: c }}>{v}</div><div style={{ fontSize: "12px", color: "#3a3458", marginTop: "2px" }}>{l}</div></div>
            ))}
          </div>
        </div>

        {/* Animated DNA Helix */}
        <div className="fu fu3" style={{ flex: "0 0 220px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ borderRadius: "16px", background: "#12101e", border: "1px solid #1e1a2e", padding: "0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DNAHelix />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "#3a3458", marginTop: "12px", letterSpacing: "1px" }}>A · T · G · C · 5mC · 6mA</div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "600", marginBottom: "8px" }}>How it works</h2>
          <p style={{ fontSize: "14px", color: "#5a5078" }}>Four steps from file to DNA-encoded storage</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {steps.map((s) => (
            <div key={s.n} style={{ padding: "24px 20px", background: "#12101e", borderRadius: "10px", border: "1px solid #1e1a2e" }}>
              <div style={{ fontSize: "32px", fontWeight: "700", color: "#1a1528", marginBottom: "10px" }}>{s.n}</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: s.color, marginBottom: "6px" }}>{s.title}</div>
              <div style={{ fontSize: "13px", color: "#5a5078", lineHeight: "1.6" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 40px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "600", marginBottom: "8px" }}>Built for real-world DNA storage</h2>
          <p style={{ fontSize: "14px", color: "#5a5078" }}>Every feature meets actual biological and digital constraints</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {features.map((f) => (
            <div key={f.title} className="fcard" style={{ padding: "24px", background: "#12101e", borderRadius: "10px", border: "1px solid #1e1a2e", transition: "all 0.2s", cursor: "default" }}>
              <div style={{ fontSize: "24px", marginBottom: "12px" }}>{f.icon}</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: f.color, marginBottom: "6px" }}>{f.title}</div>
              <div style={{ fontSize: "13px", color: "#5a5078", lineHeight: "1.7" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Encoding comparison */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 40px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "600", marginBottom: "8px" }}>Two encoding modes</h2>
          <p style={{ fontSize: "14px", color: "#5a5078" }}>Choose the right encoding for your needs</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", maxWidth: "800px", margin: "0 auto" }}>
          {[
            { name: "4-Base Standard", bases: "A · T · G · C", density: "2.0 bits/base", platform: "All platforms", badge: "Ready now", color: "#a29bfe" },
            { name: "6-Base Epigenetic", bases: "A · T · G · C · 5mC · 6mA", density: "2.58 bits/base", platform: "Nanopore only", badge: "Future-ready", color: "#f0932b" },
          ].map((e) => (
            <div key={e.name} style={{ padding: "24px", background: "#12101e", borderRadius: "10px", border: "1px solid #1e1a2e" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ fontSize: "16px", fontWeight: "600", color: e.color }}>{e.name}</div>
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
      <section style={{ maxWidth: "700px", margin: "0 auto", padding: "0 40px 60px", textAlign: "center" }}>
        <div style={{ padding: "44px", borderRadius: "14px", background: "linear-gradient(135deg, #1a1528, #12101e)", border: "1px solid #2e2840" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "10px" }}>Ready to archive your first file?</h2>
          <p style={{ fontSize: "14px", color: "#5a5078", marginBottom: "24px" }}>Create a free account and start storing data in DNA today.</p>
          <button onClick={() => navigate("/register")} className="vbtn" style={{ background: "#a29bfe", color: "#0a0912", padding: "14px 36px", fontSize: "15px" }}>
            Get started — it's free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #1e1a2e", padding: "20px 40px", maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: "13px", color: "#3a3458" }}>DNA Vault — Bio-Digital Archival</div>
        <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
          <span style={{ color: "#5a5078", cursor: "pointer" }} onClick={() => navigate("/login")}>Sign in</span>
          <span style={{ color: "#5a5078", cursor: "pointer" }} onClick={() => navigate("/register")}>Register</span>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
