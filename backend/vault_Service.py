"""
vault_service.py
----------------
Zero-knowledge encrypted storage for retrieval keys.

The browser encrypts each retrieval key with AES-GCM using a key derived
from the user's password (PBKDF2, 200k iterations). Only the ciphertext
blob reaches this backend. The server CANNOT decrypt it.

We also store the associated file_id so the frontend, after decrypting,
can link each key to the right file without needing another round trip.

Schema:
    key_vault(id PK, user_id, filename, file_id, encrypted_key, iv, salt, created_at)
"""

import sqlite3
import os
from typing import List, Dict

DB_PATH = os.getenv("DB_PATH", "dna_storage.db")


def _connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def save_encrypted_key(
    user_id: int,
    filename: str,
    file_id: str,
    encrypted_key: str,
    iv: str,
    salt: str,
) -> int:
    conn = _connect()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO key_vault (user_id, filename, file_id, encrypted_key, iv, salt)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (user_id, filename, file_id, encrypted_key, iv, salt),
    )
    new_id = cur.lastrowid
    conn.commit()
    conn.close()
    return new_id


def list_encrypted_keys(user_id: int) -> List[Dict]:
    """Return all encrypted blobs for this user. Client decrypts locally."""
    conn = _connect()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, filename, file_id, encrypted_key, iv, salt, created_at
        FROM key_vault
        WHERE user_id = ?
        ORDER BY created_at DESC
        """,
        (user_id,),
    )
    rows = cur.fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "filename": r["filename"],
            "file_id": r["file_id"],
            "encrypted_key": r["encrypted_key"],
            "iv": r["iv"],
            "salt": r["salt"],
            "created_at": r["created_at"],
        }
        for r in rows
    ]


def delete_vault_entry(user_id: int, entry_id: int) -> bool:
    conn = _connect()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM key_vault WHERE id = ? AND user_id = ?",
        (entry_id, user_id),
    )
    affected = cur.rowcount
    conn.commit()
    conn.close()
    return affected > 0
