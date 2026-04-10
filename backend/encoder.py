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
 
def sequential_rs_encode(fragments):
    """Sequential RS encoding — works reliably on all platforms including Render."""
    results = []
    for i, frag in enumerate(fragments):
        results.append(encode_rs(frag))
        if (i + 1) % 100 == 0:
            print(f"  RS encoding: {i+1}/{len(fragments)}")
    return results
 
# =========================
# XOR REDUNDANCY
# =========================
def create_xor_fragment(fragments):
    if len(fragments) < 2:
        return None
    xor_bytes = bytes.fromhex(fragments[0])
    for frag in fragments[1:]:
        b = bytes.fromhex(frag)
        if len(b) < len(xor_bytes):
            b += bytes(len(xor_bytes) - len(b))
        elif len(b) > len(xor_bytes):
            xor_bytes += bytes(len(b) - len(xor_bytes))
        xor_bytes = bytes(a ^ b for a, b in zip(xor_bytes, b))
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
 
    # Track how many data fragments per chunk (exclude XOR)
    chunk_frag_counts = {}
 
    with open(file_path, "rb") as f:
        chunk_id = 0
        while True:
            chunk = f.read(1024 * 1024)
            if not chunk:
                break
 
            hasher.update(chunk)
 
            # STEP 1: Compression
            compressed = zlib.compress(chunk, 9)
 
            # STEP 2: Binary → Hex
            hex_data = compressed.hex()
 
            # STEP 3: Fragmentation
            fragment_size = 200
            fragments = [
                hex_data[i:i+fragment_size]
                for i in range(0, len(hex_data), fragment_size)
            ]
 
            data_frag_count = len(fragments)
            chunk_frag_counts[chunk_id] = data_frag_count
 
            # STEP 4: XOR redundancy
            xor_fragment = create_xor_fragment(fragments)
            if xor_fragment:
                fragments.append(xor_fragment)
 
            # STEP 5: Reed-Solomon (sequential — no multiprocessing)
            print(f"  Chunk {chunk_id}: {len(fragments)} fragments")
            fragments = sequential_rs_encode(fragments)
 
            # STEP 6: DNA Encoding
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
 
            chunk_id += 1
 
    file_hash = hasher.hexdigest()
    print(f"[7/7] Encoding complete — {len(dna_fragments)} total fragments")
    return dna_fragments, file_hash, filename
 
 
# =========================
# FILE DECODING
# =========================
def decode_fragments(fragments, filename, encoding_type="4base"):
    print(f"\n[1/6] Decoding started ({encoding_type})")
 
    parsed = []
 
    for f in fragments:
        try:
            pipe_idx = f.index('|')
            meta = f[:pipe_idx]
            dna = f[pipe_idx+1:]
 
            parts = meta.split(':')
            chunk_id = int(parts[0])
            index = int(parts[1])
            pad = int(parts[2]) if len(parts) > 2 else 0
 
            if dna.startswith(FORWARD_PRIMER):
                dna = dna[len(FORWARD_PRIMER):]
            if dna.endswith(REVERSE_PRIMER):
                dna = dna[:-len(REVERSE_PRIMER)]
 
            parsed.append((chunk_id, index, dna, pad))
        except:
            continue
 
    # Global sort
    parsed.sort(key=lambda x: (x[0], x[1]))
 
    # Group by chunk_id
    chunks = {}
    for chunk_id, index, dna, pad in parsed:
        if chunk_id not in chunks:
            chunks[chunk_id] = []
        chunks[chunk_id].append((index, dna, pad))
 
    full_hex = ""
 
    for chunk_id in sorted(chunks.keys()):
        chunk_frags = chunks[chunk_id]
        chunk_frags.sort(key=lambda x: x[0])
 
        # The last fragment is XOR redundancy — skip it during normal decoding
        # Only use data fragments (all except the last one if there are 2+ fragments)
        if len(chunk_frags) > 1:
            data_frags = chunk_frags[:-1]  # skip XOR fragment
        else:
            data_frags = chunk_frags
 
        chunk_hex = ""
        for index, dna, pad in data_frags:
            try:
                if encoding_type == "6base":
                    hex_frag = dna_to_hex_6(dna, pad)
                else:
                    hex_frag = dna_to_hex_decode_4(dna)
 
                rs_decoded = decode_rs(hex_frag)
                if rs_decoded:
                    chunk_hex += rs_decoded
            except Exception as e:
                print(f"  Warning: Failed to decode fragment {chunk_id}:{index} — {e}")
                continue
 
        full_hex += chunk_hex
 
    if len(full_hex) % 2 != 0:
        full_hex = full_hex[:-1]
 
    full_binary = bytes.fromhex(full_hex)
 
    try:
        final_data = zlib.decompress(full_binary)
        print("✅ Decompression successful")
    except Exception as e:
        print(f"❌ Decompression failed: {e}")
        final_data = full_binary
 
    os.makedirs("output_files", exist_ok=True)
    path = os.path.join("output_files", filename)
    with open(path, "wb") as f:
        f.write(final_data)
 
    print(f"✅ File reconstructed: {path} ({len(final_data)} bytes)")
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