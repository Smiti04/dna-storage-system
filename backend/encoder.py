import os
import zlib
import hashlib
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
# 6-BASE MAP
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
    max_len = max(len(f) // 2 for f in fragments)
    xor_bytes = bytearray(max_len)
    for frag in fragments:
        b = bytes.fromhex(frag)
        for i in range(len(b)):
            xor_bytes[i] ^= b[i]
    return xor_bytes.hex()


# =========================
# FILE ENCODING (SPEED OPTIMIZED)
# =========================
def encode_file(file_path, encoding_type="4base"):
    print(f"\n[ENC] Starting {encoding_type} encoding...")

    filename = os.path.basename(file_path)
    hasher = hashlib.sha256()

    with open(file_path, "rb") as f:
        raw_data = f.read()

    hasher.update(raw_data)
    file_hash = hasher.hexdigest()
    raw_size = len(raw_data)

    # Compress — level 1 for speed
    compressed = zlib.compress(raw_data, 1)
    print(f"[ENC] {raw_size} -> {len(compressed)} bytes")

    hex_data = compressed.hex()

    # Fragment — 5000 hex chars per fragment
    # 3.5MB → ~1400 fragments instead of ~7000
    fragment_size = 5000
    fragments = [hex_data[i:i+fragment_size] for i in range(0, len(hex_data), fragment_size)]
    total_frags = len(fragments)
    print(f"[ENC] {total_frags} fragments")

    # XOR redundancy
    xor_fragment = create_xor_fragment(fragments)
    if xor_fragment:
        fragments.append(xor_fragment)

    # Reed-Solomon — the slowest step
    print(f"[ENC] Reed-Solomon encoding...")
    rs_fragments = []
    for i, f in enumerate(fragments):
        rs_fragments.append(encode_rs(f))
        if (i + 1) % 200 == 0:
            print(f"[ENC]   RS: {i+1}/{len(fragments)}")
    fragments = rs_fragments

    # DNA encoding + single-pass constraints (no retry loop)
    print(f"[ENC] DNA encoding...")
    dna_fragments = []
    chunk_id = 0

    for index, frag in enumerate(fragments):
        if encoding_type == "6base":
            dna, pad = hex_to_dna_6(frag)
            meta = f"{chunk_id}:{str(index).zfill(8)}:{pad}"
        else:
            dna = hex_to_dna_encode_4(frag)
            pad = 0
            meta = f"{chunk_id}:{str(index).zfill(8)}"

        dna = apply_dna_constraints(dna, encoding_type)
        dna = FORWARD_PRIMER + dna + REVERSE_PRIMER
        dna_fragments.append(f"{meta}|{dna}")

    print(f"[ENC] Done — {len(dna_fragments)} fragments")
    return dna_fragments, file_hash, filename


# =========================
# FILE DECODING
# =========================
def decode_fragments(fragments, filename, encoding_type="4base"):
    print(f"\n[DEC] Decoding ({encoding_type})")

    parsed = []
    for f in fragments:
        try:
            pipe_idx = f.index('|')
            meta = f[:pipe_idx]
            dna = f[pipe_idx+1:]
            parts = meta.split(':')

            chunk_id = int(parts[0])
            idx = int(parts[1])

            seed_idx = 0
            pad = 0
            if len(parts) == 3:
                if encoding_type == "6base":
                    pad = int(parts[2])
                else:
                    try:
                        seed_idx = int(parts[2])
                    except:
                        pass
            elif len(parts) == 4:
                seed_idx = int(parts[2])
                pad = int(parts[3])

            if dna.startswith(FORWARD_PRIMER):
                dna = dna[len(FORWARD_PRIMER):]
            if dna.endswith(REVERSE_PRIMER):
                dna = dna[:-len(REVERSE_PRIMER)]

            parsed.append((chunk_id, idx, dna, pad, seed_idx))
        except:
            continue

    parsed.sort(key=lambda x: (x[0], x[1]))

    chunks = {}
    for chunk_id, idx, dna, pad, seed_idx in parsed:
        if chunk_id not in chunks:
            chunks[chunk_id] = []
        chunks[chunk_id].append((idx, dna, pad, seed_idx))

    full_hex = ""
    for chunk_id in sorted(chunks.keys()):
        chunk_frags = chunks[chunk_id]
        chunk_frags.sort(key=lambda x: x[0])

        if len(chunk_frags) > 1:
            data_frags = chunk_frags[:-1]
        else:
            data_frags = chunk_frags

        for idx, dna, pad, seed_idx in data_frags:
            try:
                if encoding_type == "6base":
                    hex_frag = dna_to_hex_6(dna, pad)
                else:
                    hex_frag = dna_to_hex_decode_4(dna)

                if seed_idx > 0:
                    SCRAMBLE_SEEDS = [0x00, 0xAA, 0x55, 0xCC, 0x33, 0xF0, 0x0F, 0x69]
                    if seed_idx < len(SCRAMBLE_SEEDS):
                        seed = SCRAMBLE_SEEDS[seed_idx]
                        data = bytes.fromhex(hex_frag)
                        hex_frag = bytes(b ^ seed for b in data).hex()

                rs_decoded = decode_rs(hex_frag)
                if rs_decoded:
                    full_hex += rs_decoded
            except Exception as e:
                print(f"  Warning: fragment {chunk_id}:{idx} failed - {e}")
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