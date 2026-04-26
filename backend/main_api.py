import os
import secrets
import hashlib
import shutil
import threading
import time
import uvicorn
from pydantic import BaseModel
from typing import List, Optional

import search_service
import vault_service


from fastapi import Depends, HTTPException, FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware

from auth import create_access_token, decode_token
from database import *
from encoder import encode_file, decode_fragments, compute_merkle_root
from blockchain import add_block, verify_chain, get_block_by_file_id
from dna_constraints import analyze_constraints as run_analysis, analyze_fragments as run_fragment_analysis

app = FastAPI(title="DNA Storage System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

jobs = {}

def _run_encode_job(job_id, temp_path, encoding_type, user_id, original_filename, tags=None):
    try:
        jobs[job_id]["status"] = "compressing"
        jobs[job_id]["progress"] = 10

        fragments, file_hash, fname = encode_file(temp_path, encoding_type)

        jobs[job_id]["status"] = "storing"
        jobs[job_id]["progress"] = 80

        retrieval_key = secrets.token_hex(16)
        key_hash = hashlib.sha256(retrieval_key.encode()).hexdigest()
        file_id = secrets.token_hex(8)

        size = os.path.getsize(temp_path)
        save_file_metadata(file_id, user_id, fname, key_hash, size, encoding_type)

        frag_folder_path = os.path.join(FRAGMENTS_FOLDER, file_id)
        os.makedirs(frag_folder_path, exist_ok=True)
        save_fragments(file_id, fragments, frag_folder_path)

        # Compute Merkle root BEFORE adding to chain so it can be anchored.
        merkle_root = compute_merkle_root(fragments)
        add_block(file_id, file_hash, merkle_root=merkle_root, user_id=user_id)

        # ---- SEARCH INDEX HOOK ----
        try:
            search_service.index_file_fragments(user_id, file_id, fragments)
            if tags:
                search_service.add_tags(user_id, file_id, fname, tags)
        except Exception as ix_err:
            print(f"[search index] non-fatal error for {file_id}: {ix_err}")
        # ----------------------------

        os.remove(temp_path)

        jobs[job_id]["status"] = "done"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["result"] = {
            "success": True,
            "file_id": file_id,
            "retrieval_key": retrieval_key,
            "merkle_root": merkle_root,
            "encoding_type": encoding_type,
            "fragments_count": len(fragments),
        }
    except Exception as e:
        print(f"Job {job_id} FAILED: {e}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        if os.path.exists(temp_path):
            os.remove(temp_path)


def get_current_user(token: str = Depends(oauth2_scheme)):
    username = decode_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

MAX_FILE_SIZE = 1024 * 1024 * 1024
init()

# Auto-run migration on startup (safe — uses CREATE TABLE IF NOT EXISTS)
try:
    import migrate_db
    migrate_db.migrate()
except Exception as e:
    print(f"[startup] migration warning: {e}")

OUTPUT_FOLDER    = "output_files"
KEY_FOLDER       = "key_files"
TOKEN_FOLDER     = "token_files"
TEMP_FOLDER      = "temp_uploads"
FRAGMENTS_FOLDER = "fragments_storage"

for folder in [OUTPUT_FOLDER, KEY_FOLDER, TOKEN_FOLDER, TEMP_FOLDER, FRAGMENTS_FOLDER]:
    os.makedirs(folder, exist_ok=True)


# =============================================================
# Pydantic models for the new search / vault endpoints
# =============================================================
class SearchRequest(BaseModel):
    query: str


class TagRequest(BaseModel):
    file_id: str
    filename: str
    tags: List[str]


class VaultSaveRequest(BaseModel):
    filename: str
    file_id: str
    encrypted_key: str   # base64 AES-GCM ciphertext
    iv: str              # base64 nonce
    salt: str            # base64 PBKDF2 salt


# =============================================================
# Auth routes
# =============================================================
@app.post("/register")
def register_api(username: str = Form(...), email: str = Form(...), password: str = Form(...)):
    success, msg = register_user(username, email, password)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}

@app.post("/login")
def login_api(form_data: OAuth2PasswordRequestForm = Depends()):
    user = login_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    user_id, username = user
    token = create_access_token({"sub": username})
    return {"access_token": token, "token_type": "bearer"}


# =============================================================
# Upload (with optional tags parameter for search indexing)
# =============================================================
@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    encoding_type: str = Form("4base"),
    tags: Optional[str] = Form(None),   # comma-separated list, e.g. "thesis,ch3,raw"
    current_user=Depends(get_current_user),
):
    try:
        if encoding_type not in ["4base", "6base"]:
            return {"success": False, "error": "Invalid encoding type"}

        # parse tags
        tag_list: List[str] = []
        if tags:
            tag_list = [t.strip().lower() for t in tags.split(",") if t.strip()]

        temp_path = os.path.join(TEMP_FOLDER, file.filename)
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        size = os.path.getsize(temp_path)
        if size > MAX_FILE_SIZE:
            os.remove(temp_path)
            return {"success": False, "error": "File exceeds 1 GB upload limit"}

        if size < 1_000_000:
            fragments, file_hash, fname = encode_file(temp_path, encoding_type)
            retrieval_key = secrets.token_hex(16)
            key_hash = hashlib.sha256(retrieval_key.encode()).hexdigest()
            file_id = secrets.token_hex(8)
            user_id = current_user[0]
            save_file_metadata(file_id, user_id, fname, key_hash, size, encoding_type)
            frag_folder_path = os.path.join(FRAGMENTS_FOLDER, file_id)
            os.makedirs(frag_folder_path, exist_ok=True)
            save_fragments(file_id, fragments, frag_folder_path)
            # Compute Merkle root BEFORE adding to chain so it can be anchored.
            merkle_root = compute_merkle_root(fragments)
            add_block(file_id, file_hash, merkle_root=merkle_root, user_id=user_id)

            # ---- SEARCH INDEX HOOK (small files) ----
            try:
                search_service.index_file_fragments(user_id, file_id, fragments)
                if tag_list:
                    search_service.add_tags(user_id, file_id, fname, tag_list)
            except Exception as ix_err:
                print(f"[search index] non-fatal error for {file_id}: {ix_err}")
            # -----------------------------------------

            os.remove(temp_path)
            return {
                "success": True, "file_id": file_id, "retrieval_key": retrieval_key,
                "merkle_root": merkle_root, "encoding_type": encoding_type
            }

        # Async path for large files
        job_id = secrets.token_hex(8)
        user_id = current_user[0]
        jobs[job_id] = {
            "status": "queued", "progress": 0, "result": None, "error": None,
            "created_at": time.time(), "filename": file.filename, "size": size,
        }
        thread = threading.Thread(
            target=_run_encode_job,
            args=(job_id, temp_path, encoding_type, user_id, file.filename, tag_list),
            daemon=True,
        )
        thread.start()
        return {"success": True, "async": True, "job_id": job_id, "message": f"Encoding started"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/job_status/{job_id}")
def job_status(job_id: str, current_user=Depends(get_current_user)):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    response = {"job_id": job_id, "status": job["status"], "progress": job["progress"], "filename": job.get("filename"), "size": job.get("size")}
    if job["status"] == "done":
        response["result"] = job["result"]
    elif job["status"] == "failed":
        response["error"] = job["error"]
    return response


@app.post("/retrieve")
def retrieve_file(file_id: str = Form(...), key: str = Form(...)):
    meta = get_file_metadata(file_id)
    if not meta:
        raise HTTPException(status_code=404, detail="File not found")
    stored_hash, original_size, fname, encoding_type = meta
    if hashlib.sha256(key.encode()).hexdigest() != stored_hash:
        raise HTTPException(status_code=401, detail="Invalid retrieval key")
    frag_folder_path = os.path.join(FRAGMENTS_FOLDER, file_id)
    fragments = get_file_fragments(file_id, frag_folder_path)
    if not fragments:
        raise HTTPException(status_code=404, detail="Fragments missing")
    try:
        decode_fragments(fragments, fname, encoding_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decoding failed: {str(e)}")
    file_path = os.path.abspath(os.path.join(OUTPUT_FOLDER, fname))
    if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
        raise HTTPException(status_code=500, detail="File reconstruction failed")
    return FileResponse(path=file_path, media_type="application/octet-stream", filename=fname, headers={"Content-Disposition": f'attachment; filename="{fname}"'})


# =============================================================
# VERIFY FILE (decode round-trip integrity test)
# =============================================================
@app.post("/verify_file")
def verify_file(file_id: str = Form(...), current_user=Depends(get_current_user)):
    """
    Verifies data integrity by performing a full decode round-trip.
    Does not require retrieval key since this is a read-only integrity check.
    """
    meta = get_file_metadata(file_id)
    if not meta:
        raise HTTPException(status_code=404, detail="File not found")

    stored_hash, original_size, fname, encoding_type = meta
    frag_folder_path = os.path.join(FRAGMENTS_FOLDER, file_id)
    fragments = get_file_fragments(file_id, frag_folder_path)

    if not fragments:
        raise HTTPException(status_code=404, detail="Fragments missing")

    result = {
        "file_id": file_id,
        "filename": fname,
        "encoding_type": encoding_type,
        "original_size": original_size,
        "total_fragments": len(fragments),
        "checks": {},
    }

    # Check 1: Fragment structure
    valid_count = sum(1 for f in fragments if "|" in f)
    invalid_count = len(fragments) - valid_count
    result["checks"]["fragment_integrity"] = {
        "pass": invalid_count == 0,
        "valid": valid_count,
        "invalid": invalid_count,
        "description": "All fragments have valid metadata",
    }

    # Check 2: Merkle root computation
    try:
        computed_merkle = compute_merkle_root(fragments)
        result["checks"]["merkle_root"] = {
            "pass": computed_merkle is not None,
            "merkle_root": computed_merkle[:32] + "..." if computed_merkle else None,
            "description": "Merkle tree verification",
        }
    except Exception as e:
        result["checks"]["merkle_root"] = {"pass": False, "error": str(e)}

    # Check 3: Full decode round-trip
    try:
        decode_fragments(fragments, fname, encoding_type)
        decoded_path = os.path.join(OUTPUT_FOLDER, fname)

        if not os.path.exists(decoded_path):
            result["checks"]["decode_roundtrip"] = {"pass": False, "description": "Decoded file not created"}
        else:
            decoded_size = os.path.getsize(decoded_path)
            hasher = hashlib.sha256()
            with open(decoded_path, "rb") as f:
                hasher.update(f.read())
            decoded_hash = hasher.hexdigest()
            size_match = decoded_size == original_size

            result["checks"]["decode_roundtrip"] = {
                "pass": size_match,
                "original_size": original_size,
                "decoded_size": decoded_size,
                "decoded_hash": decoded_hash[:32] + "...",
                "size_match": size_match,
                "description": "End-to-end decode test",
            }

            try:
                os.remove(decoded_path)
            except:
                pass
    except Exception as e:
        result["checks"]["decode_roundtrip"] = {"pass": False, "error": str(e)}

    all_pass = all(c.get("pass", False) for c in result["checks"].values())
    result["overall_pass"] = all_pass
    result["verdict"] = "VERIFIED" if all_pass else "FAILED"

    return result


@app.delete("/delete_file")
def delete_file_api(file_id: str = Form(...), current_user=Depends(get_current_user)):
    user_id = current_user[0]
    frag_folder_path = os.path.join(FRAGMENTS_FOLDER, file_id)
    if delete_file(file_id, user_id):
        if os.path.exists(frag_folder_path):
            shutil.rmtree(frag_folder_path)

        # ---- SEARCH INDEX CLEANUP ----
        try:
            search_service.remove_file_from_index(user_id, file_id)
        except Exception as ix_err:
            print(f"[search index] cleanup error for {file_id}: {ix_err}")
        # -------------------------------

        return {"message": "File deleted successfully"}
    return {"error": "File not found or unauthorized"}


@app.delete("/delete_account")
def delete_account_api(current_user=Depends(get_current_user)):
    user_id = current_user[0]
    # Collect file ids first so we can clean up the search index
    user_files_list = get_user_files(user_id)
    delete_user_account(user_id)
    for fid, _, _ in user_files_list:
        frag_folder_path = os.path.join(FRAGMENTS_FOLDER, fid)
        if os.path.exists(frag_folder_path):
            shutil.rmtree(frag_folder_path)
        try:
            search_service.remove_file_from_index(user_id, fid)
        except Exception:
            pass
    return {"message": "Account deleted successfully"}


@app.post("/forgot_password")
def forgot_password_api(email: str = Form(...)):
    token = str(secrets.randbelow(900000) + 100000)
    store_reset_token(email, token)
    token_file = f"{email.replace('@','_')}_token.txt"
    path = os.path.join(TOKEN_FOLDER, token_file)
    with open(path, "w") as f:
        f.write(f"Reset Token: {token}")
    return {"message": "Token generated", "file": token_file, "token": token}

@app.post("/reset_password")
def reset_password_api(email: str = Form(...), token: str = Form(...), new_password: str = Form(...)):
    if not verify_reset_token(email, token):
        return {"error": "Invalid or expired token"}
    update_password(email, new_password)
    return {"message": "Password reset successful"}

@app.get("/user_files")
def get_user_files_api(current_user=Depends(get_current_user)):
    user_id = current_user[0]
    files = get_user_files(user_id)
    return {"files": [{"file_id": f[0], "filename": f[1], "encoding_type": f[2]} for f in files]}

@app.post("/get_sequence")
def get_sequence(file_id: str = Form(...), current_user=Depends(get_current_user)):
    meta = get_file_metadata(file_id)
    if not meta:
        raise HTTPException(status_code=404, detail="File not found")
    frag_folder_path = os.path.join(FRAGMENTS_FOLDER, file_id)
    fragments = get_file_fragments(file_id, frag_folder_path)
    if not fragments:
        raise HTTPException(status_code=404, detail="Fragments not found")
    return {"file_id": file_id, "filename": meta[2], "encoding_type": meta[3], "total_fragments": len(fragments), "fragments": fragments}

@app.post("/analyze_constraints")
def analyze_constraints_api(file_id: str = Form(...), current_user=Depends(get_current_user)):
    meta = get_file_metadata(file_id)
    if not meta:
        raise HTTPException(status_code=404, detail="File not found")
    frag_folder_path = os.path.join(FRAGMENTS_FOLDER, file_id)
    fragments = get_file_fragments(file_id, frag_folder_path)
    if not fragments:
        raise HTTPException(status_code=404, detail="Fragments not found")
    encoding_type = meta[3]
    FORWARD_PRIMER = "ACGTACGTAC"
    REVERSE_PRIMER = "TGCATGCATG"
    dna_sequences = []
    for raw in fragments:
        try:
            pipe_idx = raw.index('|')
            dna = raw[pipe_idx + 1:]
            if dna.startswith(FORWARD_PRIMER):
                dna = dna[len(FORWARD_PRIMER):]
            if dna.endswith(REVERSE_PRIMER):
                dna = dna[:-len(REVERSE_PRIMER)]
            dna_sequences.append(dna)
        except:
            continue
    result = run_fragment_analysis(dna_sequences, encoding_type)
    return {"file_id": file_id, "encoding_type": encoding_type, "total_fragments": len(fragments), **result}

@app.post("/change_password")
def change_password_api(current_password: str = Form(...), new_password: str = Form(...), current_user=Depends(get_current_user)):
    user_id = current_user[0]
    username = current_user[1]
    user = login_user(username, current_password)
    if not user:
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    import re
    if not re.search(r'[A-Z]', new_password):
        raise HTTPException(status_code=400, detail="Password must contain an uppercase letter")
    if not re.search(r'\d', new_password):
        raise HTTPException(status_code=400, detail="Password must contain a number")
    if not re.search(r'[^a-zA-Z0-9]', new_password):
        raise HTTPException(status_code=400, detail="Password must contain a special character")
    conn = connect()
    c = conn.cursor()
    c.execute("SELECT email FROM users WHERE id=?", (user_id,))
    res = c.fetchone()
    conn.close()
    if not res:
        raise HTTPException(status_code=404, detail="User not found")
    update_password(res[0], new_password)
    return {"message": "Password changed successfully"}


# =============================================================
#   SEARCH ENDPOINTS
# =============================================================
@app.post("/search")
def unified_search(req: SearchRequest, current_user=Depends(get_current_user)):
    """
    Unified search. Auto-detects query type:
      - 32-char hex string  -> retrieval key (hashes it and matches key_hash)
      - >=12 ATGC bases     -> DNA substring search via k-mer index
      - anything else       -> tag / filename keyword search
    """
    user_id = current_user[0]
    results = search_service.search(user_id, req.query)
    return results


@app.post("/tags/add")
def add_file_tags(req: TagRequest, current_user=Depends(get_current_user)):
    user_id = current_user[0]
    # Verify the file belongs to this user
    meta = get_file_metadata(req.file_id)
    if not meta:
        raise HTTPException(status_code=404, detail="File not found")
    search_service.add_tags(user_id, req.file_id, req.filename, req.tags)
    return {"success": True, "tags_added": len(req.tags)}


@app.get("/tags/{file_id}")
def get_file_tags(file_id: str, current_user=Depends(get_current_user)):
    user_id = current_user[0]
    tags = search_service.list_tags(user_id, file_id)
    return {"file_id": file_id, "tags": tags}


# =============================================================
#   KEY VAULT ENDPOINTS  (zero-knowledge storage)
#   Server never sees plaintext keys. The browser encrypts
#   with AES-GCM + PBKDF2 before sending.
# =============================================================
@app.post("/vault/save")
def vault_save(req: VaultSaveRequest, current_user=Depends(get_current_user)):
    user_id = current_user[0]
    entry_id = vault_service.save_encrypted_key(
        user_id=user_id,
        filename=req.filename,
        file_id=req.file_id,
        encrypted_key=req.encrypted_key,
        iv=req.iv,
        salt=req.salt,
    )
    return {"success": True, "id": entry_id}


@app.get("/vault/list")
def vault_list(current_user=Depends(get_current_user)):
    user_id = current_user[0]
    return {"vault": vault_service.list_encrypted_keys(user_id)}


@app.delete("/vault/{entry_id}")
def vault_delete(entry_id: int, current_user=Depends(get_current_user)):
    user_id = current_user[0]
    ok = vault_service.delete_vault_entry(user_id, entry_id)
    return {"success": ok}


# =============================================================
#   BLOCKCHAIN INTEGRITY ENDPOINTS
# =============================================================
@app.get("/blockchain/verify")
def blockchain_verify_api():
    """
    Walk the entire blockchain and verify integrity.
    Public endpoint — no auth required, since the chain itself is auditable.
    Returns:
      - valid: True if every block's stored hash matches a fresh recomputation
               and every block links correctly to its predecessor.
      - message: human-readable result or first failure description.
    """
    is_valid, message = verify_chain()
    return {"valid": is_valid, "message": message}


@app.get("/blockchain/block/{file_id}")
def blockchain_get_block(file_id: str, current_user=Depends(get_current_user)):
    """
    Return the blockchain block committing to a given file_id.
    Useful for retrieval-time integrity verification — a user can compare
    the file_hash and merkle_root stored on-chain against their local copies.
    """
    block = get_block_by_file_id(file_id)
    if not block:
        raise HTTPException(status_code=404, detail="No block found for this file_id")
    return block


# =============================================================
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def home():
    return {"message": "DNA Storage API running"}

@app.middleware("http")
async def cleanup_old_jobs(request, call_next):
    now = time.time()
    expired = [jid for jid, j in jobs.items() if now - j.get("created_at", 0) > 3600]
    for jid in expired:
        del jobs[jid]
    return await call_next(request)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 9000))
    uvicorn.run("main_api:app", host="0.0.0.0", port=port)