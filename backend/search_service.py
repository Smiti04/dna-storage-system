"""
search_service.py
------------------
Search engine for DNA Vault — three modes auto-detected from query shape:

  1. Retrieval key search  - 32-char hex token
                             We hash it with SHA-256 and match the stored
                             key_hash column in the files table. This keeps
                             the zero-knowledge property: the server never
                             needs to store the plaintext key.

  2. DNA substring search  - >= 12 ATGC bases
                             We pre-index overlapping k-mers (k=12) for each
                             fragment and rank results by Jaccard overlap.

  3. Tag / filename search - anything else
                             Case-insensitive LIKE match against user-defined
                             tags and original filenames.

Works with your existing schema:
    files(file_id PK, user_id, filename, key_hash, size, encoding_type, ...)

We keep the new tables in a sibling DB file when possible, but default to
the same DB the rest of the app uses.
"""

import sqlite3
import hashlib
import os
import re
from typing import List, Dict

DB_PATH = os.getenv("DB_PATH", "dna_storage.db")
KMER_SIZE = 12


# -------------------------------------------------------------------------
# Low-level helpers
# -------------------------------------------------------------------------
def _connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _extract_kmers(sequence: str, k: int = KMER_SIZE) -> List[str]:
    """Extract overlapping k-mers from a DNA string (ATGC only)."""
    seq = "".join(c for c in sequence.upper() if c in "ATGC")
    if len(seq) < k:
        return []
    return [seq[i : i + k] for i in range(len(seq) - k + 1)]


# -------------------------------------------------------------------------
# Indexing (called from /upload)
# -------------------------------------------------------------------------
def index_file_fragments(user_id: int, file_id: str, fragments: List[str]) -> int:
    """
    Build the k-mer index for a newly encoded file.
    `fragments` is the list returned by encode_file() — each entry looks like
        "chunk:index:seed|PRIMER+DNA+PRIMER"
    We strip the metadata prefix before extracting k-mers.
    """
    conn = _connect()
    cur = conn.cursor()

    rows = []
    for frag_idx, raw in enumerate(fragments):
        if "|" in raw:
            dna_part = raw.split("|", 1)[1]
        else:
            dna_part = raw
        # one row per unique kmer per fragment
        for kmer in set(_extract_kmers(dna_part)):
            rows.append((user_id, file_id, kmer, frag_idx))

    if rows:
        cur.executemany(
            "INSERT INTO dna_search_index (user_id, file_id, kmer, fragment_idx) "
            "VALUES (?, ?, ?, ?)",
            rows,
        )

    conn.commit()
    conn.close()
    return len(rows)


def remove_file_from_index(user_id: int, file_id: str):
    """Remove all search data for a file (called from /delete_file)."""
    conn = _connect()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM dna_search_index WHERE user_id = ? AND file_id = ?",
        (user_id, file_id),
    )
    cur.execute(
        "DELETE FROM file_tags WHERE user_id = ? AND file_id = ?",
        (user_id, file_id),
    )
    conn.commit()
    conn.close()


# -------------------------------------------------------------------------
# Tag management
# -------------------------------------------------------------------------
def add_tags(user_id: int, file_id: str, filename: str, tags: List[str]):
    if not tags:
        return
    conn = _connect()
    cur = conn.cursor()
    clean = [
        (user_id, file_id, filename, t.strip().lower())
        for t in tags if t and t.strip()
    ]
    cur.executemany(
        "INSERT INTO file_tags (user_id, file_id, filename, tag) "
        "VALUES (?, ?, ?, ?)",
        clean,
    )
    conn.commit()
    conn.close()


def list_tags(user_id: int, file_id: str) -> List[str]:
    conn = _connect()
    cur = conn.cursor()
    cur.execute(
        "SELECT DISTINCT tag FROM file_tags WHERE user_id = ? AND file_id = ?",
        (user_id, file_id),
    )
    out = [r[0] for r in cur.fetchall()]
    conn.close()
    return out


# -------------------------------------------------------------------------
# Unified search entry point
# -------------------------------------------------------------------------
_HEX32 = re.compile(r"^[0-9a-fA-F]{32}$")


def search(user_id: int, query: str) -> Dict:
    """
    Returns {"mode": "key"|"dna"|"tag"|"empty", "results": [...]}
    Each result includes file_id so the frontend can call /retrieve or
    /get_sequence directly.
    """
    q = (query or "").strip()
    if not q:
        return {"mode": "empty", "results": []}

    # 1) Retrieval key (32-char hex — matches secrets.token_hex(16))
    if _HEX32.match(q):
        hit = _key_search(user_id, q)
        if hit:
            return {"mode": "key", "results": [hit]}
        # fall through — maybe the user is searching a tag that happens
        # to look hex-ish (unlikely, but safe)

    # 2) DNA segment (pure ATGC, >= 12 bases)
    clean_dna = q.upper().replace(" ", "")
    if re.fullmatch(r"[ATGC]+", clean_dna) and len(clean_dna) >= KMER_SIZE:
        return {"mode": "dna", "results": _dna_search(user_id, clean_dna)}

    # 3) Tag / filename keyword
    return {"mode": "tag", "results": _tag_search(user_id, q)}


def _key_search(user_id: int, key: str):
    """Hash the pasted key and match against files.key_hash."""
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    conn = _connect()
    cur = conn.cursor()
    # Note: your existing schema column names — adjust if different
    cur.execute(
        "SELECT file_id, filename, encoding_type FROM files "
        "WHERE user_id = ? AND key_hash = ? LIMIT 1",
        (user_id, key_hash),
    )
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "file_id": row["file_id"],
        "filename": row["filename"],
        "encoding_type": row["encoding_type"],
        "score": 1.0,
        "match_type": "exact_key",
        "tags": list_tags(user_id, row["file_id"]),
    }


def _tag_search(user_id: int, keyword: str) -> List[Dict]:
    """Match the keyword against tags AND filenames (case-insensitive, partial)."""
    kw = f"%{keyword.lower()}%"
    conn = _connect()
    cur = conn.cursor()

    # Tag matches
    cur.execute(
        """
        SELECT DISTINCT file_id, filename
        FROM file_tags
        WHERE user_id = ? AND LOWER(tag) LIKE ?
        """,
        (user_id, kw),
    )
    hits = {r["file_id"]: r["filename"] for r in cur.fetchall()}

    # Filename matches
    cur.execute(
        "SELECT file_id, filename FROM files "
        "WHERE user_id = ? AND LOWER(filename) LIKE ?",
        (user_id, kw),
    )
    for r in cur.fetchall():
        hits.setdefault(r["file_id"], r["filename"])

    # Enrich results with encoding_type
    results = []
    for file_id, filename in hits.items():
        cur.execute(
            "SELECT encoding_type FROM files WHERE file_id = ? LIMIT 1",
            (file_id,),
        )
        enc_row = cur.fetchone()
        results.append({
            "file_id": file_id,
            "filename": filename,
            "encoding_type": enc_row["encoding_type"] if enc_row else "4base",
            "score": 1.0,
            "match_type": "tag",
            "tags": list_tags(user_id, file_id),
        })
    conn.close()
    return results


def _dna_search(user_id: int, dna: str) -> List[Dict]:
    """
    Match query k-mers against the pre-built index and rank by overlap.
    Score = (matched unique k-mers) / (total unique query k-mers)
    Results below 0.5 are filtered out to reduce noise.
    """
    query_kmers = list(set(_extract_kmers(dna)))
    if not query_kmers:
        return []

    placeholders = ",".join("?" * len(query_kmers))
    conn = _connect()
    cur = conn.cursor()
    cur.execute(
        f"""
        SELECT file_id, COUNT(DISTINCT kmer) AS match_count
        FROM dna_search_index
        WHERE user_id = ? AND kmer IN ({placeholders})
        GROUP BY file_id
        ORDER BY match_count DESC
        LIMIT 20
        """,
        [user_id, *query_kmers],
    )
    raw = cur.fetchall()

    results = []
    total = len(query_kmers)
    for row in raw:
        score = row["match_count"] / total
        if score < 0.5:
            continue
        cur.execute(
            "SELECT filename, encoding_type FROM files "
            "WHERE file_id = ? AND user_id = ? LIMIT 1",
            (row["file_id"], user_id),
        )
        file_row = cur.fetchone()
        if not file_row:
            continue
        results.append({
            "file_id": row["file_id"],
            "filename": file_row["filename"],
            "encoding_type": file_row["encoding_type"],
            "score": round(score, 3),
            "match_type": "dna_segment",
            "matched_kmers": row["match_count"],
            "total_kmers": total,
            "tags": list_tags(user_id, row["file_id"]),
        })
    conn.close()
    return results
