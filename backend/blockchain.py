"""
DNA Vault — Tamper-Evident Blockchain Ledger
=============================================

Permissioned hash-chained ledger for file integrity commitments.
Each block commits to:
  - file_id        : unique file identifier
  - file_hash      : SHA-256 of the original raw file bytes (pre-compression)
  - merkle_root    : Merkle root over the encoded fragment set
  - user_id        : owner of the upload (for provenance)

The hash chain provides tamper-evidence: any retroactive modification
of a block breaks the hash linkage and is detected by verify_chain().

This is NOT a decentralized consensus blockchain. There is one trusted
writer (the server). Tamper-evidence depends on at least one external
party (typically the user) holding a recent block hash as a receipt.
"""

import hashlib
import json
import os
import time

BLOCKCHAIN_FILE = "blockchain_chain.json"


def create_genesis_block():
    """Initialize the chain with a genesis block if it doesn't exist."""
    if not os.path.exists(BLOCKCHAIN_FILE):
        genesis_block = {
            "index": 0,
            "timestamp": time.time(),
            "file_id": "GENESIS",
            "file_hash": "0",
            "merkle_root": "0",
            "user_id": "SYSTEM",
            "previous_hash": "0",
            "hash": "0"
        }
        with open(BLOCKCHAIN_FILE, "w") as f:
            json.dump([genesis_block], f, indent=4)


def get_chain():
    """Load the full chain from disk. Creates genesis block if needed."""
    if not os.path.exists(BLOCKCHAIN_FILE):
        create_genesis_block()
    with open(BLOCKCHAIN_FILE, "r") as f:
        return json.load(f)


def calculate_hash(index, timestamp, file_id, file_hash, merkle_root, user_id, previous_hash):
    """
    Compute the SHA-256 hash of a block's contents.
    All seven fields are included so that any modification is detected.
    """
    data = f"{index}{timestamp}{file_id}{file_hash}{merkle_root}{user_id}{previous_hash}"
    return hashlib.sha256(data.encode()).hexdigest()


def add_block(file_id, file_hash, merkle_root="0", user_id="UNKNOWN"):
    """
    Append a new block committing to (file_id, file_hash, merkle_root, user_id).

    merkle_root and user_id default to placeholder values for backward
    compatibility with older callers — but new uploads should always pass them.
    """
    chain = get_chain()
    last_block = chain[-1]
    index = last_block["index"] + 1
    timestamp = time.time()
    previous_hash = last_block["hash"]

    block_hash = calculate_hash(
        index, timestamp, file_id, file_hash,
        merkle_root, user_id, previous_hash
    )

    block = {
        "index": index,
        "timestamp": timestamp,
        "file_id": file_id,
        "file_hash": file_hash,
        "merkle_root": merkle_root,
        "user_id": str(user_id),
        "previous_hash": previous_hash,
        "hash": block_hash
    }

    chain.append(block)
    with open(BLOCKCHAIN_FILE, "w") as f:
        json.dump(chain, f, indent=4)

    print(f"Blockchain: Block {index} added for file {file_id}.")
    return block


def verify_chain():
    """
    Walk the entire chain and verify two properties for every block:
      1. The block's stored hash matches a recomputation from its fields.
      2. The block's previous_hash matches the previous block's stored hash.

    Returns:
        (is_valid, message) — is_valid is True/False, message describes
                              the result or first failure.
    """
    chain = get_chain()

    if len(chain) == 0:
        return False, "Chain is empty (no genesis block)."

    # Genesis block is special — it has hash="0" by construction.
    # We only validate from index 1 onwards.
    for i in range(1, len(chain)):
        block = chain[i]
        prev = chain[i - 1]

        # 1. Verify the link to the previous block
        if block["previous_hash"] != prev["hash"]:
            return False, (
                f"Chain broken at block {i}: "
                f"previous_hash {block['previous_hash'][:16]}... "
                f"does not match prior block hash {prev['hash'][:16]}..."
            )

        # 2. Verify this block's stored hash matches a fresh recomputation.
        # Older blocks may not have merkle_root / user_id fields — fall back
        # to defaults to remain compatible with chains created before this update.
        merkle_root = block.get("merkle_root", "0")
        user_id = block.get("user_id", "UNKNOWN")

        recomputed = calculate_hash(
            block["index"],
            block["timestamp"],
            block["file_id"],
            block["file_hash"],
            merkle_root,
            user_id,
            block["previous_hash"]
        )

        if recomputed != block["hash"]:
            return False, (
                f"Block {i} integrity check failed: "
                f"stored hash {block['hash'][:16]}... "
                f"does not match recomputed hash {recomputed[:16]}... "
                f"(block may have been tampered with, or was created with "
                f"an older code version using a different hash schema)"
            )

    return True, f"Chain is valid. {len(chain)} blocks verified."


def get_block_by_file_id(file_id):
    """
    Look up the most recent block committing to the given file_id.
    Useful for retrieval-time integrity verification.
    Returns the block dict, or None if not found.
    """
    chain = get_chain()
    for block in reversed(chain):
        if block.get("file_id") == file_id:
            return block
    return None