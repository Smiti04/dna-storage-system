import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { uploadFile, analyzeConstraints } from "../services/api";
import DNAConstraintsPanel from "../components/DNAConstraintsPanel";

function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [encodingType, setEncodingType] = useState("4base");
  const [status, setStatus] = useState("idle");
  const [log, setLog] = useState([]);
  const [result, setResult] = useState(null);
  const [constraintData, setConstraintData] = useState(null);
  const [analyzingConstraints, setAnalyzingConstraints] = useState(false);
  const inputRef = useRef();

  const addLog = (msg) => setLog((prev) => [...prev, msg]);

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setLog([]);
    setConstraintData(null);
    setResult(null);

    addLog(`Preparing: ${file.name}`);
    addLog(
      `Encoding mode: ${
        encodingType === "6base"
          ? "6-Base Epigenetic (5mC + 6mA)"
          : "4-Base Standard (A/T/G/C)"
      }`
    );
    addLog("Compressing data...");

    try {
      const res = await uploadFile(file, encodingType, (msg) => addLog(msg));

      if (res.data.success) {
        addLog("Reed-Solomon encoding applied...");
        addLog(`DNA sequence generated (${encodingType})...`);
        addLog("Stored to blockchain...");
        addLog("✓ Upload complete");
        setResult(res.data);
        setStatus("done");

        // Auto-download key file
        const keyContent = [
          `FILE ID: ${res.data.file_id}`,
          `RETRIEVAL KEY: ${res.data.retrieval_key}`,
          `MERKLE ROOT: ${res.data.merkle_root}`,
          `ENCODING: ${res.data.encoding_type}`,
        ].join("\n");

        const keyBlob = new Blob([keyContent], { type: "text/plain" });
        const url = URL.createObjectURL(keyBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${file.name}_key.txt`;
        a.click();
        URL.revokeObjectURL(url);

        // Analyze constraints automatically
        addLog("Analyzing DNA constraints...");
        setAnalyzingConstraints(true);
        try {
          const analysisRes = await analyzeConstraints(res.data.file_id);
          setConstraintData(analysisRes.data);
          addLog("✓ Constraint analysis complete");
        } catch {
          addLog("⚠ Constraint analysis failed");
        }
        setAnalyzingConstraints(false);
      } else {
        addLog(`✗ Error: ${res.data.error}`);
        setStatus("error");
      }
    } catch {
      addLog("✗ Upload failed");
      setStatus("error");
    }
  };

  const encodings = [
    {
      id: "4base",
      label: "4-BASE STANDARD",
      bases: "A · T · G · C",
      badge: "READY NOW",
      badgeColor: "var(--neon-green)",
      desc: "Standard DNA bases. Compatible with all sequencing platforms including Illumina NGS and Nanopore. Use this for immediate physical DNA storage.",
      density: "2.0 bits/base",
      compat: "All platforms",
    },
    {
      id: "6base",
      label: "6-BASE EPIGENETIC",
      bases: "A · T · G · C · 5mC · 6mA",
      badge: "FUTURE-READY",
      badgeColor: "var(--neon-blue)",
      desc: "Adds epigenetic bases 5-methylcytosine (5mC) and N6-methyladenine (6mA). +29% data density. Requires Nanopore sequencing. Ideal for future-proof archival storage.",
      density: "2.58 bits/base",
      compat: "Nanopore only",
    },
  ];

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">UPLOAD FILE</div>
        <div className="page-subtitle">
          SELECT ENCODING → DROP FILE → ENCODE & STORE
        </div>

        {/* Step 1 — Encoding selector */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-secondary)",
            letterSpacing: "2px",
            marginBottom: "12px",
          }}
        >
          STEP 1 — SELECT ENCODING MODE
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}
        >
          {encodings.map((enc) => (
            <div
              key={enc.id}
              onClick={() => setEncodingType(enc.id)}
              style={{
                flex: 1,
                minWidth: "260px",
                padding: "20px",
                background:
                  encodingType === enc.id
                    ? "rgba(0,255,136,0.05)"
                    : "var(--bg-card)",
                border: `1px solid ${
                  encodingType === enc.id ? enc.badgeColor : "var(--border)"
                }`,
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow:
                  encodingType === enc.id
                    ? `0 0 16px ${enc.badgeColor}22`
                    : "none",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "12px",
                      color: enc.badgeColor,
                      letterSpacing: "2px",
                      marginBottom: "6px",
                    }}
                  >
                    {enc.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                      color: "var(--text-primary)",
                      letterSpacing: "1px",
                    }}
                  >
                    {enc.bases}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: "999px",
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      background: `${enc.badgeColor}22`,
                      color: enc.badgeColor,
                      letterSpacing: "1px",
                      border: `1px solid ${enc.badgeColor}44`,
                    }}
                  >
                    {enc.badge}
                  </span>
                  {encodingType === enc.id && (
                    <span style={{ fontSize: "16px", color: enc.badgeColor }}>
                      ✓
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.7",
                  marginBottom: "14px",
                }}
              >
                {enc.desc}
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: "16px" }}>
                {[
                  ["DENSITY", enc.density],
                  ["SEQUENCING", enc.compat],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        color: "var(--text-muted)",
                        letterSpacing: "1px",
                      }}
                    >
                      {k}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        color: enc.badgeColor,
                      }}
                    >
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Step 2 — File drop zone */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-secondary)",
            letterSpacing: "2px",
            marginBottom: "12px",
          }}
        >
          STEP 2 — SELECT FILE
        </div>

        <div
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
          }}
          style={{
            border: `2px dashed ${
              dragging
                ? "var(--neon-green)"
                : file
                ? "rgba(0,255,136,0.4)"
                : "var(--border)"
            }`,
            borderRadius: "10px",
            padding: "40px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "rgba(0,255,136,0.04)" : "var(--bg-card)",
            transition: "all 0.2s",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "36px",
              marginBottom: "12px",
              color: file ? "var(--neon-green)" : "var(--text-muted)",
            }}
          >
            {file ? "◈" : "↑"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: file ? "var(--neon-green)" : "var(--text-secondary)",
            }}
          >
            {file ? file.name : "DROP FILE HERE OR CLICK TO BROWSE"}
          </div>
          {file && (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "6px",
              }}
            >
              {(file.size / 1024).toFixed(1)} KB
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        {/* Pre-upload summary */}
        {file && (
          <div
            className="card"
            style={{
              marginBottom: "20px",
              display: "flex",
              gap: "32px",
              flexWrap: "wrap",
            }}
          >
            {[
              ["FILE", file.name],
              ["SIZE", `${(file.size / 1024).toFixed(1)} KB`],
              [
                "ENCODING",
                encodingType === "6base"
                  ? "6-BASE EPIGENETIC"
                  : "4-BASE STANDARD",
              ],
              [
                "BASES",
                encodingType === "6base" ? "A T G C 5mC 6mA" : "A T G C",
              ],
            ].map(([k, v]) => (
              <div key={k}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    letterSpacing: "1px",
                    marginBottom: "4px",
                  }}
                >
                  {k}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--text-primary)",
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 3 — Upload button */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-secondary)",
            letterSpacing: "2px",
            marginBottom: "12px",
          }}
        >
          STEP 3 — ENCODE & STORE
        </div>

        <button
          className="btn-primary"
          onClick={handleUpload}
          disabled={!file || status === "uploading"}
          style={{ marginBottom: "24px" }}
        >
          {status === "uploading" ? "ENCODING..." : "ENCODE & STORE →"}
        </button>

        {/* Process log */}
        {log.length > 0 && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-secondary)",
                letterSpacing: "1px",
                marginBottom: "12px",
              }}
            >
              PROCESS LOG
            </div>
            {log.map((l, i) => (
              <div
                key={i}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  padding: "3px 0",
                  color: l.startsWith("✓")
                    ? "var(--neon-green)"
                    : l.startsWith("✗")
                    ? "#ef4444"
                    : l.startsWith("⚠")
                    ? "#f59e0b"
                    : "var(--text-secondary)",
                }}
              >
                ▸ {l}
              </div>
            ))}
          </div>
        )}

        {/* Result card */}
        {result && (
          <div
            className="card"
            style={{ border: "1px solid rgba(0,255,136,0.3)", marginBottom: "8px" }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--neon-green)",
                letterSpacing: "1px",
                marginBottom: "16px",
              }}
            >
              ✓ STORAGE COMPLETE
            </div>

            {[
              ["FILE ID", result.file_id],
              [
                "ENCODING",
                result.encoding_type === "6base"
                  ? "6-BASE EPIGENETIC (5mC + 6mA)"
                  : "4-BASE STANDARD",
              ],
              ["MERKLE ROOT", result.merkle_root],
            ].map(([k, v]) => (
              <div key={k} style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    letterSpacing: "1px",
                    marginBottom: "4px",
                  }}
                >
                  {k}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--text-primary)",
                    wordBreak: "break-all",
                  }}
                >
                  {v}
                </div>
              </div>
            ))}

            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--neon-green)",
                marginTop: "8px",
              }}
            >
              ✓ Retrieval key downloaded automatically
            </div>

            <button
              className="btn-primary"
              style={{ marginTop: "16px" }}
              onClick={() => navigate("/files")}
            >
              VIEW MY FILES →
            </button>
          </div>
        )}

        {/* Constraints loading */}
        {analyzingConstraints && (
          <div
            className="card"
            style={{
              marginTop: "20px",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: "var(--neon-green)",
            }}
          >
            ⏳ Analyzing DNA constraints...
          </div>
        )}

        {/* Constraints panel */}
        {constraintData && <DNAConstraintsPanel data={constraintData} />}
      </div>
    </div>
  );
}

export default Upload;