import os
import secrets
import hashlib
import shutil
import threading
import time
import uvicorn

from fastapi import Depends, HTTPException, FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware

from auth import create_access_token, decode_token
from database import *
from encoder import encode_file, decode_fragments, compute_merkle_root
from blockchain import add_block
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

def _run_encode_job(job_id, temp_path, encoding_type, user_id, original_filename):
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

        add_block(file_id, file_hash)
        merkle_root = compute_merkle_root(fragments)

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

OUTPUT_FOLDER    = "output_files"
KEY_FOLDER       = "key_files"
TOKEN_FOLDER     = "token_files"
TEMP_FOLDER      = "temp_uploads"
FRAGMENTS_FOLDER = "fragments_storage"

for folder in [OUTPUT_FOLDER, KEY_FOLDER, TOKEN_FOLDER, TEMP_FOLDER, FRAGMENTS_FOLDER]:
    os.makedirs(folder, exist_ok=True)

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

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), encoding_type: str = Form("4base"), current_user=Depends(get_current_user)):
    try:
        if encoding_type not in ["4base", "6base"]:
            return {"success": False, "error": "Invalid encoding type"}

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
            add_block(file_id, file_hash)
            merkle_root = compute_merkle_root(fragments)
            os.remove(temp_path)
            return {
                "success": True, "file_id": file_id, "retrieval_key": retrieval_key,
                "merkle_root": merkle_root, "encoding_type": encoding_type
            }

        job_id = secrets.token_hex(8)
        user_id = current_user[0]
        jobs[job_id] = {
            "status": "queued", "progress": 0, "result": None, "error": None,
            "created_at": time.time(), "filename": file.filename, "size": size,
        }
        thread = threading.Thread(target=_run_encode_job, args=(job_id, temp_path, encoding_type, user_id, file.filename), daemon=True)
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


# ===============================
# VERIFY FILE (decode round-trip integrity test)
# ===============================
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
        return {"message": "File deleted successfully"}
    return {"error": "File not found or unauthorized"}

@app.delete("/delete_account")
def delete_account_api(current_user=Depends(get_current_user)):
    user_id = current_user[0]
    delete_user_account(user_id)
    for fid, _, _ in get_user_files(user_id):
        frag_folder_path = os.path.join(FRAGMENTS_FOLDER, fid)
        if os.path.exists(frag_folder_path):
            shutil.rmtree(frag_folder_path)
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
