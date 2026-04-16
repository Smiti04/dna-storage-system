# DNA Vault 🧬

> A full-stack system for encoding digital files into synthesizable DNA sequences with blockchain verification and constraint-aware encoding.

**Live Demo:** [dna-storage-system.vercel.app](https://dna-storage-system.vercel.app)

---

## Overview

DNA Vault is a research-grade DNA storage system that converts arbitrary digital files into DNA sequences that are ready for submission to commercial synthesis providers (Twist Bioscience, IDT, GenScript). The system implements the **DNA Fountain reject-and-retry approach** (Erlich & Zielinski, *Science* 2017) to guarantee that all generated sequences satisfy biological constraints required for real-world DNA synthesis.

Built as an MSc thesis project exploring the intersection of information theory, coding theory, and synthetic biology.

---

## Key Features

- **Constraint-aware encoding** — Every fragment generated passes GC content, homopolymer, and restriction site constraints through iterative seed-based scrambling
- **Two encoding schemes** — Standard 4-base (A/T/G/C at 2.0 bits/base) and experimental 6-base epigenetic (+5mC, +6mA at 2.58 bits/base, nanopore-only)
- **Multi-layer error correction** — Reed-Solomon codes per fragment + XOR parity across fragments
- **Cryptographic verification** — SHA-256 file hashing + Merkle tree of fragments + simple blockchain
- **Lab-ready exports** — FASTA and CSV formats matching synthesis provider specifications
- **Interactive constraint analysis** — Real-time GC profile charts, base distribution donuts, homopolymer tables
- **JWT-based authentication** — Secure user accounts with password reset
- **Responsive dark UI** — Custom "DNA Vault" theme with Unbounded/JetBrains Mono typography

---

## Architecture

```
┌──────────────────┐         ┌─────────────────────┐         ┌──────────────────┐
│                  │         │                     │         │                  │
│  React Frontend  │◄───────►│  FastAPI Backend    │◄───────►│  SQLite DB       │
│  (Vite, Vercel)  │  HTTP   │  (Python, Render)   │         │  + Fragment FS   │
│                  │         │                     │         │                  │
└──────────────────┘         └──────────┬──────────┘         └──────────────────┘
                                        │
                                        ▼
                             ┌─────────────────────┐
                             │   Core Pipeline     │
                             ├─────────────────────┤
                             │ 1. Read file        │
                             │ 2. SHA-256 hash     │
                             │ 3. zlib compress    │
                             │ 4. Hex encode       │
                             │ 5. Fragment (150)   │
                             │ 6. XOR parity       │
                             │ 7. Reed-Solomon     │
                             │ 8. DNA + constraints│
                             │ 9. Primers + store  │
                             └─────────────────────┘
```

### Encoding Pipeline

```
File Bytes (e.g. 1 MB PDF)
    │
    ▼
[Compress]  zlib level 1 → smaller byte stream
    │
    ▼
[Hex]       bytes → hex string
    │
    ▼
[Fragment]  Split into 150-char chunks (~150 DNA bases each, matching real oligo sizes)
    │
    ▼
[XOR parity] +1 redundancy fragment for recovery of any lost oligo
    │
    ▼
[Reed-Solomon] Add 4 check symbols per fragment → corrects ~2 base errors/fragment
    │
    ▼
[DNA encode + constraint check]
    ├── Try seed=0: scramble=identity, hex→DNA, CHECK
    ├── If FAIL: try seed=1, scramble bytes with PRNG stream, hex→DNA, CHECK
    ├── If FAIL: try seed=2, ... up to seed=199
    └── Store successful seed in metadata (reversible via XOR)
    │
    ▼
[Primers]   Add forward primer (ACGTACGTAC) + reverse primer (TGCATGCATG)
    │
    ▼
Final fragment format: "chunk_id:index:seed|PRIMER+DNA+PRIMER"
```

### Decoding Pipeline

Reverse of the above — read seed from metadata, reverse the PRNG XOR, decode RS, reassemble, decompress.

### Constraints Enforced

| Constraint | Threshold | Why it matters |
|------------|-----------|----------------|
| GC content | 35–65% | Synthesis stability, avoids hairpins and low-Tm strands |
| Homopolymer runs | ≤3 consecutive bases | Nanopore sequencing miscounts long runs |
| Restriction sites | 0 (15 enzymes screened) | Prevents DNA being cut during cloning/processing |
| Melting temperature | 50–80°C (reported) | PCR compatibility across fragments |
| Linguistic complexity | ≥0.5 (reported) | Avoids synthesis stalling on repetitive regions |

---

## Tech Stack

**Frontend:**
- React 19 + Vite 8
- React Router 7
- Axios
- Custom SVG charts (no chart library — drawn from scratch)
- Unbounded + JetBrains Mono + Outfit fonts

**Backend:**
- FastAPI (Python)
- SQLite (file-based)
- `reedsolo` for Reed-Solomon coding
- `zlib` for compression
- JWT authentication via `python-jose`

**Deployment:**
- Frontend: Vercel (auto-deploy from `main`)
- Backend: Render free tier (auto-deploy from `main`)
- UptimeRobot: keeps backend alive via 5-min health pings

---

## Repository Structure

```
dna_storage_web/
├── backend/
│   ├── main_api.py           # FastAPI endpoints
│   ├── encoder.py            # Core DNA encoding/decoding pipeline
│   ├── dna_constraints.py    # Constraint enforcement + analysis
│   ├── database.py           # SQLite operations
│   ├── blockchain.py         # Simple blockchain + Merkle
│   ├── auth.py               # JWT creation/verification
│   ├── requirements.txt
│   └── render.yaml           # Render deployment config
└── dna-frontend/
    ├── package.json
    ├── vercel.json           # SPA rewrites
    └── src/
        ├── App.jsx
        ├── pages/            # Landing, Login, Register, Dashboard,
        │                     # Upload, Retrieve, ViewFiles,
        │                     # SequenceViewer, ChangePassword
        ├── components/       # Sidebar, BackendLoader,
        │                     # DNAConstraintsPanel, ProtectedRoute
        ├── services/api.js   # Axios client
        ├── utils/            # fastaExport, downloadReport
        └── styles/theme.css
```

---

## Running Locally

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate     # Windows
pip install -r requirements.txt
python main_api.py
# Runs on http://127.0.0.1:9000
```

### Frontend

```bash
cd dna-frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

Create `.env.production` with:
```
VITE_API_URL=https://your-backend-url
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create account |
| POST | `/login` | JWT login |
| POST | `/upload` | Upload + encode file (async for large) |
| GET | `/job_status/{id}` | Poll async encoding progress |
| POST | `/retrieve` | Decode + download file |
| GET | `/user_files` | List user's files |
| POST | `/get_sequence` | Retrieve DNA fragments |
| POST | `/analyze_constraints` | Full constraint analysis |
| DELETE | `/delete_file` | Remove stored file |
| POST | `/change_password` | Update password |
| GET | `/health` | Health check (for UptimeRobot) |

---

## Research Context

This project implements and extends ideas from:

1. **Erlich & Zielinski (2017)** — *DNA Fountain enables a robust and efficient storage architecture*, Science 355(6328). The seed-retry approach for constraint adherence is directly inspired by their fountain code design.

2. **Church et al. (2012)** — *Next-generation digital information storage in DNA*, Science 337(6102). Foundational DNA storage paper establishing homopolymer and GC constraints.

3. **Goldman et al. (2013)** — *Towards practical, high-capacity, low-maintenance information storage in synthesized DNA*, Nature 494.

4. **SantaLucia (1998)** — Unified nearest-neighbor thermodynamics (used for melting temperature estimation).

5. **Welzel et al. (2023)** — *DNA-Aeon*, Nature Communications (inspiration for motif/restriction site screening).

---

## Known Limitations

- **Simulation only** — The system generates sequences but does not physically synthesize DNA
- **Render free tier** — Backend sleeps after 15 min of inactivity; data resets on redeploy (SQLite + local filesystem fragments)
- **No random access** — Full-file retrieval only; no selective fragment access
- **No error simulation** — Future work: inject artificial mutations to validate RS recovery rates
- **6-base encoding** — Theoretical only; requires nanopore sequencing for decoding

---

## Future Work

- PostgreSQL migration for persistent storage
- Cloudflare R2 for fragment blob storage
- Error simulation suite (insertion/deletion/substitution at varying rates)
- Quantitative comparison with DNA Fountain, Church, Goldman methods
- Integration with real synthesis lab APIs
- Support for multi-file archives (ZIP-like DNA volumes)

---

## License

MIT — Free to use for research and educational purposes.

## Author

Built as an MSc thesis project on DNA-based digital storage systems.
