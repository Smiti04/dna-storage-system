import sqlite3
import hashlib
import re
import time

DB = "dna_storage.db"
MAX_FILE_SIZE = 100 * 1024 * 1024

def connect():
    return sqlite3.connect(DB)

def init():
    conn = connect()
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password_hash TEXT
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS files(
        file_id TEXT PRIMARY KEY,
        user_id INTEGER,
        filename TEXT,
        key_hash TEXT,
        original_size INTEGER,
        encoding_type TEXT DEFAULT '4base'
    )
    """)

    # Migrate existing DB safely
    try:
        c.execute("ALTER TABLE files ADD COLUMN encoding_type TEXT DEFAULT '4base'")
    except:
        pass  # column already exists, no problem

    c.execute("""
    CREATE TABLE IF NOT EXISTS fragments(
        file_id TEXT,
        fragment_index INTEGER,
        fragment TEXT
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS reset_tokens(
        email TEXT PRIMARY KEY,
        token TEXT,
        timestamp REAL
    )
    """)

    conn.commit()
    conn.close()

# ---------------- PASSWORD CHECK ----------------
def check_password_strength(password):
    has_upper = re.search(r'[A-Z]', password)
    has_digit = re.search(r'\d', password)
    has_special = re.search(r'[^a-zA-Z0-9]', password)
    return has_upper and has_digit and has_special

# ---------------- USER ----------------
def register_user(username, email, password):
    if len(username) < 3 or len(username) > 10:
        return False, "Username must be 3-10 characters"
    if len(password) < 8 or not check_password_strength(password):
        return False, "Password must be >=8 chars with uppercase, number, special char"
    if "@" not in email or "." not in email:
        return False, "Invalid email format"

    conn = connect()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username=?", (username,))
    if c.fetchone():
        conn.close()
        return False, "Username already exists"
    c.execute("SELECT * FROM users WHERE email=?", (email,))
    if c.fetchone():
        conn.close()
        return False, "Email already registered"

    password_hash = hashlib.sha256(password.encode()).hexdigest()
    c.execute(
        "INSERT INTO users(username,email,password_hash) VALUES(?,?,?)",
        (username, email, password_hash)
    )
    conn.commit()
    conn.close()
    return True, "Registration successful"

def login_user(identifier, password):
    conn = connect()
    c = conn.cursor()
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    c.execute("""
        SELECT id, username FROM users
        WHERE (username=? OR email=?) AND password_hash=?
    """, (identifier, identifier, password_hash))
    result = c.fetchone()
    conn.close()
    return result

def get_user_by_username(username):
    conn = connect()
    c = conn.cursor()
    c.execute(
        "SELECT id, username, password_hash FROM users WHERE username=?",
        (username,)
    )
    user = c.fetchone()
    conn.close()
    return user

# ---------------- FILE METADATA ----------------
def save_file_metadata(file_id, user_id, filename, key_hash, original_size, encoding_type="4base"):
    conn = connect()
    c = conn.cursor()
    c.execute(
        "INSERT INTO files VALUES(?,?,?,?,?,?)",
        (file_id, user_id, filename, key_hash, original_size, encoding_type)
    )
    conn.commit()
    conn.close()

def get_file_metadata(file_id):
    conn = connect()
    c = conn.cursor()
    # Returns: key_hash, original_size, filename, encoding_type
    c.execute(
        "SELECT key_hash, original_size, filename, encoding_type FROM files WHERE file_id=?",
        (file_id,)
    )
    res = c.fetchone()
    conn.close()
    return res

def get_user_files(user_id):
    conn = connect()
    c = conn.cursor()
    c.execute(
        "SELECT file_id, filename, encoding_type FROM files WHERE user_id=?",
        (user_id,)
    )
    files = c.fetchall()
    conn.close()
    return files

# ---------------- FRAGMENTS ----------------
def save_fragments(file_id, fragments, folder_path):
    import os
    for i, frag in enumerate(fragments):
        path = os.path.join(folder_path, f"frag_{i}.txt")
        with open(path, "w") as f:
            f.write(frag)

    conn = connect()
    c = conn.cursor()
    for i, fragment in enumerate(fragments):
        c.execute(
            "INSERT INTO fragments(file_id, fragment_index, fragment) VALUES(?,?,?)",
            (file_id, i, fragment)
        )
    conn.commit()
    conn.close()

def get_file_fragments(file_id, folder_path):
    import os
    fragments = []
    if not os.path.exists(folder_path):
        return []
    files = sorted(os.listdir(folder_path))
    for file in files:
        with open(os.path.join(folder_path, file), "r") as f:
            fragments.append(f.read())
    return fragments

# ---------------- DELETE ----------------
def delete_file(file_id, user_id):
    conn = connect()
    c = conn.cursor()
    c.execute(
        "SELECT * FROM files WHERE file_id=? AND user_id=?",
        (file_id, user_id)
    )
    if not c.fetchone():
        conn.close()
        return False
    c.execute("DELETE FROM fragments WHERE file_id=?", (file_id,))
    c.execute("DELETE FROM files WHERE file_id=?", (file_id,))
    conn.commit()
    conn.close()
    return True

def delete_user_account(user_id):
    conn = connect()
    c = conn.cursor()
    c.execute("SELECT file_id FROM files WHERE user_id=?", (user_id,))
    files = c.fetchall()
    for f in files:
        c.execute("DELETE FROM fragments WHERE file_id=?", (f[0],))
    c.execute("DELETE FROM files WHERE user_id=?", (user_id,))
    c.execute("DELETE FROM users WHERE id=?", (user_id,))
    conn.commit()
    conn.close()

# ---------------- PASSWORD RESET ----------------
def store_reset_token(email, token):
    conn = connect()
    c = conn.cursor()
    c.execute(
        "REPLACE INTO reset_tokens(email,token,timestamp) VALUES(?,?,?)",
        (email, token, time.time())
    )
    conn.commit()
    conn.close()

def verify_reset_token(email, token):
    conn = connect()
    c = conn.cursor()
    c.execute(
        "SELECT token, timestamp FROM reset_tokens WHERE email=?",
        (email,)
    )
    res = c.fetchone()
    if not res:
        conn.close()
        return False
    stored_token, timestamp = res
    if stored_token != token or (time.time() - timestamp > 600):
        conn.close()
        return False
    c.execute("DELETE FROM reset_tokens WHERE email=?", (email,))
    conn.commit()
    conn.close()
    return True

def update_password(email, new_password):
    password_hash = hashlib.sha256(new_password.encode()).hexdigest()
    conn = connect()
    c = conn.cursor()
    c.execute(
        "UPDATE users SET password_hash=? WHERE email=?",
        (password_hash, email)
    )
    conn.commit()
    conn.close()