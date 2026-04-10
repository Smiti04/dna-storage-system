import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Animated DNA helix using pure CSS
function DNAHelix() {
  return (
    <div style={{ position: "relative", width: "60px", height: "200px", margin: "0 auto" }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", top: `${i * 20}px`, width: "100%", height: "4px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          animation: `helixSpin 2s ease-in-out ${i * 0.15}s infinite alternate`,
        }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"][i % 4], boxShadow: `0 0 8px ${["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"][i % 4]}40` }} />
          <div style={{ flex: 1, height: "1.5px", background: `linear-gradient(90deg, ${["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"][i % 4]}60, ${["#22c55e", "#f59e0b", "#ef4444", "#3b82f6"][i % 4]}60)`, margin: "0 4px" }} />
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6"][i % 4], boxShadow: `0 0 8px ${["#22c55e", "#f59e0b", "#ef4444", "#3b82f6"][i % 4]}40` }} />
        </div>
      ))}
    </div>
  );
}

function Landing() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => { setVisible(true); }, []);

  const features = [
    {
      icon: "🧬",
      title: "DNA Encoding",
      desc: "Files are compressed, fragmented, and encoded into synthetic DNA sequences using 4-base (A/T/G/C) or 6-base epigenetic encoding with +29% density.",
    },
    {
      icon: "🔐",
      title: "Blockchain Verified",
      desc: "Every file is registered on a blockchain with Merkle tree verification, ensuring tamper-proof integrity of your stored data.",
    },
    {
      icon: "🛡️",
      title: "Reed-Solomon Error Correction",
      desc: "Industrial-grade error correction ensures your data survives degradation — the same technology used in CDs, QR codes, and deep-space communication.",
    },
    {
      icon: "🔬",
      title: "Constraint-Optimized",
      desc: "DNA sequences are automatically balanced for GC content (45–55%) and homopolymer prevention, meeting real-world synthesis requirements.",
    },
  ];

  const steps = [
    { num: "01", title: "Upload", desc: "Drop any file — documents, images, videos, archives" },
    { num: "02", title: "Encode", desc: "File is compressed, encoded into DNA with error correction" },
    { num: "03", title: "Store", desc: "DNA fragments are stored and blockchain-registered" },
    { num: "04", title: "Retrieve", desc: "Use your retrieval key to decode and download anytime" },
  ];

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", overflow: "hidden" }}>
      <style>{`
        @keyframes helixSpin {
          0% { transform: scaleX(1); }
          100% { transform: scaleX(-1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .fade-up {
          opacity: 0;
          animation: fadeUp 0.7s ease forwards;
        }
        .fade-up-1 { animation-delay: 0.1s; }
        .fade-up-2 { animation-delay: 0.2s; }
        .fade-up-3 { animation-delay: 0.35s; }
        .fade-up-4 { animation-delay: 0.5s; }
        .landing-btn {
          padding: 14px 32px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-family: 'DM Sans', sans-serif;
        }
        .landing-btn:hover {
          transform: translateY(-2px);
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important;
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 40px", maxWidth: "1200px", margin: "0 auto",
      }}>
        <div style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>
          DNA Store
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => navigate("/login")}
            className="landing-btn"
            style={{ background: "transparent", color: "#475569", border: "1px solid #e2e8f0" }}
            onMouseOver={e => e.currentTarget.style.borderColor = "#2563eb"}
            onMouseOut={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
            Sign in
          </button>
          <button onClick={() => navigate("/register")}
            className="landing-btn"
            style={{ background: "#2563eb", color: "#fff", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}
            onMouseOver={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.4)"}
            onMouseOut={e => e.currentTarget.style.boxShadow = "0 4px 14px rgba(37,99,235,0.3)"}>
            Get started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: "1200px", margin: "0 auto", padding: "80px 40px 60px",
        display: "flex", alignItems: "center", gap: "60px",
      }}>
        <div style={{ flex: 1 }}>
          <div className="fade-up fade-up-1" style={{
            display: "inline-block", padding: "6px 14px", borderRadius: "999px",
            background: "#eff6ff", color: "#2563eb", fontSize: "13px", fontWeight: "600",
            marginBottom: "20px",
          }}>
            Next-generation data storage
          </div>

          <h1 className="fade-up fade-up-2" style={{
            fontSize: "clamp(36px, 5vw, 56px)", fontWeight: "800", color: "#0f172a",
            lineHeight: "1.15", letterSpacing: "-1px", marginBottom: "20px",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Store your files in<br />
            <span style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              synthetic DNA
            </span>
          </h1>

          <p className="fade-up fade-up-3" style={{
            fontSize: "18px", color: "#64748b", lineHeight: "1.7",
            maxWidth: "480px", marginBottom: "32px",
          }}>
            Encode any file into DNA sequences with blockchain verification,
            Reed-Solomon error correction, and real-world synthesis-ready constraints.
            The future of data storage, available today.
          </p>

          <div className="fade-up fade-up-4" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/register")}
              className="landing-btn"
              style={{ background: "#2563eb", color: "#fff", boxShadow: "0 4px 14px rgba(37,99,235,0.3)", padding: "14px 36px" }}>
              Start encoding
            </button>
            <button onClick={() => {
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
            }}
              className="landing-btn"
              style={{ background: "#fff", color: "#475569", border: "1px solid #e2e8f0" }}>
              How it works ↓
            </button>
          </div>

          {/* Mini stats */}
          <div className="fade-up fade-up-4" style={{ display: "flex", gap: "32px", marginTop: "48px" }}>
            {[
              ["2.0–2.58", "bits per base"],
              ["Reed-Solomon", "error correction"],
              ["Blockchain", "verified integrity"],
            ].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a" }}>{val}</div>
                <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "2px" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side — DNA visual */}
        <div style={{
          flex: "0 0 300px", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }} className="fade-up fade-up-3">
          <div style={{
            width: "280px", height: "320px", borderRadius: "24px",
            background: "linear-gradient(135deg, #eff6ff, #f5f3ff)",
            border: "1px solid #e2e8f0", display: "flex", alignItems: "center",
            justifyContent: "center", position: "relative", overflow: "hidden",
          }}>
            {/* Background pattern */}
            <div style={{
              position: "absolute", inset: 0, opacity: 0.3,
              backgroundImage: "radial-gradient(circle at 2px 2px, #cbd5e1 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }} />
            <div style={{ position: "relative", animation: "float 4s ease-in-out infinite" }}>
              <DNAHelix />
            </div>
          </div>
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "#94a3b8", letterSpacing: "1px" }}>
              A · T · G · C · 5mC · 6mA
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{
        maxWidth: "1200px", margin: "0 auto", padding: "80px 40px",
      }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.5px", marginBottom: "12px" }}>
            How it works
          </h2>
          <p style={{ fontSize: "16px", color: "#64748b", maxWidth: "500px", margin: "0 auto" }}>
            Four simple steps from file to DNA-encoded storage
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
          {steps.map((step, i) => (
            <div key={step.num} style={{
              padding: "28px", background: "#fff", borderRadius: "14px",
              border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              position: "relative",
            }}>
              <div style={{
                fontSize: "40px", fontWeight: "800", color: "#eff6ff",
                fontFamily: "'DM Sans', sans-serif", marginBottom: "12px",
                lineHeight: 1,
              }}>{step.num}</div>
              <div style={{ fontSize: "17px", fontWeight: "600", color: "#0f172a", marginBottom: "8px" }}>{step.title}</div>
              <div style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6" }}>{step.desc}</div>
              {i < steps.length - 1 && (
                <div style={{
                  position: "absolute", right: "-16px", top: "50%", transform: "translateY(-50%)",
                  color: "#cbd5e1", fontSize: "20px", zIndex: 1,
                  display: window.innerWidth < 768 ? "none" : "block",
                }}>→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{
        maxWidth: "1200px", margin: "0 auto", padding: "40px 40px 80px",
      }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.5px", marginBottom: "12px" }}>
            Built for real-world DNA storage
          </h2>
          <p style={{ fontSize: "16px", color: "#64748b", maxWidth: "520px", margin: "0 auto" }}>
            Every feature designed to meet actual biological and digital constraints
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          {features.map((f) => (
            <div key={f.title} className="feature-card" style={{
              padding: "28px", background: "#fff", borderRadius: "14px",
              border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.25s ease", cursor: "default",
            }}>
              <div style={{ fontSize: "28px", marginBottom: "14px" }}>{f.icon}</div>
              <div style={{ fontSize: "17px", fontWeight: "600", color: "#0f172a", marginBottom: "8px" }}>{f.title}</div>
              <div style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.7" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Encoding comparison */}
      <section style={{
        maxWidth: "1200px", margin: "0 auto", padding: "0 40px 80px",
      }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.5px", marginBottom: "12px" }}>
            Two encoding modes
          </h2>
          <p style={{ fontSize: "16px", color: "#64748b" }}>Choose the right encoding for your needs</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "800px", margin: "0 auto" }}>
          {[
            {
              name: "4-Base Standard", bases: "A · T · G · C", density: "2.0 bits/base",
              platform: "All platforms", badge: "Ready now", badgeColor: "#16a34a", badgeBg: "#f0fdf4",
              desc: "Standard DNA encoding compatible with all sequencing platforms including Illumina and Nanopore.",
            },
            {
              name: "6-Base Epigenetic", bases: "A · T · G · C · 5mC · 6mA", density: "2.58 bits/base",
              platform: "Nanopore only", badge: "Future-ready", badgeColor: "#2563eb", badgeBg: "#eff6ff",
              desc: "Epigenetic encoding with methylated bases for 29% higher data density. Requires Nanopore sequencing.",
            },
          ].map((enc) => (
            <div key={enc.name} style={{
              padding: "28px", background: "#fff", borderRadius: "14px",
              border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a" }}>{enc.name}</div>
                <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "600", background: enc.badgeBg, color: enc.badgeColor }}>{enc.badge}</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>{enc.bases}</div>
              <div style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginBottom: "16px" }}>{enc.desc}</div>
              <div style={{ display: "flex", gap: "24px", fontSize: "13px" }}>
                <div><span style={{ color: "#94a3b8" }}>Density: </span><span style={{ fontWeight: "600", color: "#0f172a" }}>{enc.density}</span></div>
                <div><span style={{ color: "#94a3b8" }}>Platform: </span><span style={{ fontWeight: "600", color: "#0f172a" }}>{enc.platform}</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        maxWidth: "800px", margin: "0 auto", padding: "0 40px 80px", textAlign: "center",
      }}>
        <div style={{
          padding: "48px", borderRadius: "20px",
          background: "linear-gradient(135deg, #1e40af, #2563eb, #3b82f6)",
          color: "#fff", position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0, opacity: 0.1,
            backgroundImage: "radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }} />
          <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "12px", position: "relative" }}>
            Ready to encode your first file?
          </h2>
          <p style={{ fontSize: "16px", opacity: 0.85, marginBottom: "28px", position: "relative" }}>
            Create a free account and start storing data in DNA today.
          </p>
          <button onClick={() => navigate("/register")}
            className="landing-btn"
            style={{
              background: "#fff", color: "#2563eb", fontWeight: "700",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)", position: "relative",
              padding: "14px 40px", fontSize: "16px",
            }}>
            Get started — it's free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #e2e8f0", padding: "24px 40px",
        maxWidth: "1200px", margin: "0 auto",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ fontSize: "14px", color: "#94a3b8" }}>
          DNA Store — Bio-Digital Storage System
        </div>
        <div style={{ display: "flex", gap: "20px", fontSize: "13px" }}>
          <span style={{ color: "#94a3b8", cursor: "pointer" }} onClick={() => navigate("/login")}>Sign in</span>
          <span style={{ color: "#94a3b8", cursor: "pointer" }} onClick={() => navigate("/register")}>Register</span>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
