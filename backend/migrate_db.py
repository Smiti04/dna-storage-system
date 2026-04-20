"""
Database migration for DNA Vault search + key vault features.

Run ONCE after pulling these changes:
    python migrate_db.py

Creates three new tables:
  1. file_tags        - user-defined searchable tags per file
  2. key_vault        - encrypted retrieval keys (zero-knowledge storage)
  3. dna_search_index - indexed DNA k-mers for substring search

All use file_id as the file reference (matching your existing `files` table).
Safe to run multiple times.
"""

import sqlite3
import os

DB_PATH = os.getenv("DB_PATH", "dna_storage.db")


def migrate():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # ------------------------------------------------------------
    # 1. file_tags
    # ------------------------------------------------------------
    cur.execute("""
        CREATE TABLE IF NOT EXISTS file_tags (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id       INTEGER NOT NULL,
            file_id       TEXT NOT NULL,
            filename      TEXT NOT NULL,
            tag           TEXT NOT NULL,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_tags_user    ON file_tags(user_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_tags_tag     ON file_tags(tag)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_tags_file_id ON file_tags(file_id)")

    # ------------------------------------------------------------
    # 2. key_vault  (zero-knowledge encrypted blobs)
    # ------------------------------------------------------------
    cur.execute("""
        CREATE TABLE IF NOT EXISTS key_vault (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL,
            filename        TEXT NOT NULL,
            file_id         TEXT NOT NULL,
            encrypted_key   TEXT NOT NULL,
            iv              TEXT NOT NULL,
            salt            TEXT NOT NULL,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_vault_user ON key_vault(user_id)")

    # ------------------------------------------------------------
    # 3. dna_search_index  (k-mer inverted index)
    # ------------------------------------------------------------
    cur.execute("""
        CREATE TABLE IF NOT EXISTS dna_search_index (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id       INTEGER NOT NULL,
            file_id       TEXT NOT NULL,
            kmer          TEXT NOT NULL,
            fragment_idx  INTEGER NOT NULL
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_dnasearch_kmer ON dna_search_index(kmer)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_dnasearch_user ON dna_search_index(user_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_dnasearch_file ON dna_search_index(file_id)")

    conn.commit()
    conn.close()
    print("[migrate_db] Migration complete. Tables ready:")
    print("  - file_tags")
    print("  - key_vault")
    print("  - dna_search_index")


if __name__ == "__main__":
    migrate()
