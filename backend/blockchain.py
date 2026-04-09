# blockchain.py
import hashlib
import json
import os
import time

BLOCKCHAIN_FILE = "blockchain_chain.json"

def create_genesis_block():
    if not os.path.exists(BLOCKCHAIN_FILE):
        genesis_block = {
            "index": 0,
            "timestamp": time.time(),
            "file_id": "GENESIS",
            "file_hash": "0",
            "previous_hash": "0",
            "hash": "0"
        }
        with open(BLOCKCHAIN_FILE, "w") as f:
            json.dump([genesis_block], f, indent=4)

def get_chain():
    if not os.path.exists(BLOCKCHAIN_FILE):
        create_genesis_block()
    with open(BLOCKCHAIN_FILE, "r") as f:
        return json.load(f)

def calculate_hash(index, timestamp, file_id, file_hash, previous_hash):
    data = f"{index}{timestamp}{file_id}{file_hash}{previous_hash}"
    return hashlib.sha256(data.encode()).hexdigest()

def add_block(file_id, file_hash):
    chain = get_chain()
    last_block = chain[-1]
    index = last_block["index"] + 1
    timestamp = time.time()
    previous_hash = last_block["hash"]
    block_hash = calculate_hash(index, timestamp, file_id, file_hash, previous_hash)
    block = {
        "index": index,
        "timestamp": timestamp,
        "file_id": file_id,
        "file_hash": file_hash,
        "previous_hash": previous_hash,
        "hash": block_hash
    }
    chain.append(block)
    with open(BLOCKCHAIN_FILE, "w") as f:
        json.dump(chain, f, indent=4)
    print("Blockchain: File registered in chain.")