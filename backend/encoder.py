import os
import zlib
import hashlib
from tqdm import tqdm
import reedsolo
from dna_constraints import apply_dna_constraints
 
# =========================
# REED SOLOMON
# =========================
rs = reedsolo.RSCodec(10)
 
# =========================
# PRIMERS
# =========================
FORWARD_PRIMER = "ACGTACGTAC"
REVERSE_PRIMER = "TGCATGCATG"
 
# =========================
# 4-BASE MAP
# =========================
hex_to_dna_map_4 = {
    "0": "AA","1": "AT","2": "AC","3": "AG",
    "4": "TA","5": "TT","6": "TC","7": "TG",
    "8": "CA","9": "CT","a": "CG","b": "CC",
    "c": "GA","d": "GT","e": "GG","f": "GC"
}
dna_to_hex_map_4 = {v: k for k, v in hex_to_dna_map_4.items()}
 
# =========================
# 6-BASE MAP (epigenetic)
# =========================
BASE6 = ['A', 'T', 'G', 'C', 'M', 'X']
 
def hex3_to_base6(hex3):
    val = int(hex3, 16)
    result = []
    for _ in range(5):
        result.append(BASE6[val % 6])
        val //= 6
    return ''.join(reversed(result))
 
def base6_to_hex3(bases):
    val = 0
    for b in bases:
        val = val * 6 + BASE6.index(b)
    return format(val, '03x')
 
def hex_to_dna_6(hex_string):
    pad = (3 - len(hex_string) % 3) % 3
    hex_string = hex_string + '0' * pad
    dna = ''
    for i in range(0, len(hex_string), 3):
        dna += hex3_to_base6(hex_string[i:i+3])
    return dna, pad
 
def dna_to_hex_6(dna, pad=0):
    hex_string = ''
    for i in range(0, len(dna), 5):
        hex_string += base6_to_hex3(dna[i:i+5])
    if pad:
        hex_string = hex_string[:-pad]
    return hex_string
 
# =========================
# 4-BASE HELPERS
# =========================
def hex_to_dna_encode_4(hex_string):
    return "".join(hex_to_dna_map_4[h] for h in hex_string)
 
def dna_to_hex_decode_4(dna):
    hex_string = ""
    for i in range(0, len(dna), 2):
        pair = dna[i:i+2]
        if pair not in dna_to_hex_map_4:
            raise ValueError(f"Invalid DNA pair: {pair}")
        hex_string += dna_to_hex_map_4[pair]
    return hex_string
 
# =========================
# REED SOLOMON
# =========================
def encode_rs(fragment):
    return rs.encode(bytes.fromhex(fragment)).hex()
 
def decode_rs(fragment):
    try:
        return rs.decode(bytes.fromhex(fragment))[0].hex()
    except:
        return None
 
# =========================
# XOR REDUNDANCY
# =========================
def create_xor_fragment(fragments):
    if len(fragments) < 2:
        return None
    max_len = max(len(bytes.fromhex(f)) for f in fragments)
    xor_bytes = bytearray(max_len)
    for frag in fragments:
        b = bytes.fromhex(frag)
        for i in range(len(b)):
            xor_bytes[i] ^= b[i]
    return xor_bytes.hex()
 
# =========================
# FILE ENCODING
# =========================
def encode_file(file_path, encoding_type="4base"):
    print(f"\n[1/7] Encoding file with {encoding_type} encoding...")
 
    filename = os.path.basename(file_path)
    dna_fragments = []
    index = 0
    hasher = hashlib.sha256()
 
    with open(file_path, "rb") as f:
        raw_data = f.read()
 
    hasher.update(raw_data)
    file_hash = hasher.hexdigest()
 
    # STEP 1: Compress entire file (level 6 — fast, good ratio)
    print("[2/7] Compressing...")
    compressed = zlib.compress(raw_data, 6)
    print(f"  {len(raw_data)} -> {len(compressed)} bytes")
 
    # STEP 2: Hex
    hex_data = compressed.hex()
 
    # STEP 3: Fragment (larger fragments = fewer total = faster)
    fragment_size = 500
    fragments = [hex_data[i:i+fragment_size] for i in range(0, len(hex_data), fragment_size)]
    print(f"[3/7] {len(fragments)} fragments")
 
    # STEP 4: XOR redundancy
    xor_fragment = create_xor_fragment(fragments)
    if xor_fragment:
        fragments.append(xor_fragment)
 
    # STEP 5: Reed-Solomon
    print(f"[4/7] Reed-Solomon encoding...")
    fragments = [encode_rs(f) for f in fragments]
 
    # STEP 6: DNA Encoding
    print(f"[5/7] DNA encoding...")
    chunk_id = 0
    for frag in fragments:
        if encoding_type == "6base":
            dna, pad = hex_to_dna_6(frag)
            meta = f"{chunk_id}:{str(index).zfill(8)}:{pad}"
        else:
            dna = hex_to_dna_encode_4(frag)
            meta = f"{chunk_id}:{str(index).zfill(8)}"
 
        dna = apply_dna_constraints(dna, encoding_type)
        dna = FORWARD_PRIMER + dna + REVERSE_PRIMER
        dna_fragments.append(f"{meta}|{dna}")
        index += 1
 
    print(f"[7/7] Done — {len(dna_fragments)} fragments")
    return dna_fragments, file_hash, filename
 
 
# =========================
# FILE DECODING
# =========================
def decode_fragments(fragments, filename, encoding_type="4base"):
    print(f"\n[1/6] Decoding ({encoding_type})")
 
    parsed = []
    for f in fragments:
        try:
            pipe_idx = f.index('|')
            meta = f[:pipe_idx]
            dna = f[pipe_idx+1:]
            parts = meta.split(':')
            chunk_id = int(parts[0])
            idx = int(parts[1])
            pad = int(parts[2]) if len(parts) > 2 else 0
 
            if dna.startswith(FORWARD_PRIMER):
                dna = dna[len(FORWARD_PRIMER):]
            if dna.endswith(REVERSE_PRIMER):
                dna = dna[:-len(REVERSE_PRIMER)]
 
            parsed.append((chunk_id, idx, dna, pad))
        except:
            continue
 
    parsed.sort(key=lambda x: (x[0], x[1]))
 
    # Group by chunk
    chunks = {}
    for chunk_id, idx, dna, pad in parsed:
        if chunk_id not in chunks:
            chunks[chunk_id] = []
        chunks[chunk_id].append((idx, dna, pad))
 
    full_hex = ""
    for chunk_id in sorted(chunks.keys()):
        chunk_frags = chunks[chunk_id]
        chunk_frags.sort(key=lambda x: x[0])
 
        # Skip last fragment (XOR redundancy)
        if len(chunk_frags) > 1:
            data_frags = chunk_frags[:-1]
        else:
            data_frags = chunk_frags
 
        for idx, dna, pad in data_frags:
            try:
                if encoding_type == "6base":
                    hex_frag = dna_to_hex_6(dna, pad)
                else:
                    hex_frag = dna_to_hex_decode_4(dna)
                rs_decoded = decode_rs(hex_frag)
                if rs_decoded:
                    full_hex += rs_decoded
            except Exception as e:
                print(f"  Warning: fragment {chunk_id}:{idx} failed — {e}")
                continue
 
    if len(full_hex) % 2 != 0:
        full_hex = full_hex[:-1]
 
    full_binary = bytes.fromhex(full_hex)
 
    try:
        final_data = zlib.decompress(full_binary)
        print("OK Decompression successful")
    except Exception as e:
        print(f"ERR Decompression failed: {e}")
        final_data = full_binary
 
    os.makedirs("output_files", exist_ok=True)
    path = os.path.join("output_files", filename)
    with open(path, "wb") as f:
        f.write(final_data)
 
    print(f"OK Reconstructed: {path} ({len(final_data)} bytes)")
    return path
 
 
# =========================
# MERKLE TREE
# =========================
def compute_merkle_root(fragments):
    hashes = [hashlib.sha256(f.encode()).hexdigest() for f in fragments]
    if not hashes:
        return None
    while len(hashes) > 1:
        if len(hashes) % 2 == 1:
            hashes.append(hashes[-1])
        new_hashes = []
        for i in range(0, len(hashes), 2):
            combined = hashes[i] + hashes[i+1]
            new_hashes.append(hashlib.sha256(combined.encode()).hexdigest())
        hashes = new_hashes
    return hashes[0]
 