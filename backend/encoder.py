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
# CONSTRAINT-AWARE ENCODING
# =========================

# Rotation maps — each map is a valid bijection so decoding stays reversible.
# The idea: if the default hex→DNA mapping produces a bad sequence (homopolymer
# or skewed GC), we XOR the hex data with a different seed before mapping.
# The seed index is stored in the fragment metadata so the decoder can reverse it.
SCRAMBLE_SEEDS = [
    0x00,  # seed 0 = no change (original)
    0xAA,  # seed 1
    0x55,  # seed 2
    0xCC,  # seed 3
    0x33,  # seed 4
    0xF0,  # seed 5
    0x0F,  # seed 6
    0x69,  # seed 7
]

def scramble_hex(hex_string, seed):
    """XOR every byte of hex_string with seed byte. Reversible."""
    if seed == 0x00:
        return hex_string
    data = bytes.fromhex(hex_string)
    scrambled = bytes(b ^ seed for b in data)
    return scrambled.hex()

def unscramble_hex(hex_string, seed):
    """Reverse of scramble — XOR is its own inverse."""
    return scramble_hex(hex_string, seed)


def check_gc_content(dna, lo=0.35, hi=0.65):
    """Quick GC check without importing full constraints module."""
    if not dna:
        return True
    gc = sum(1 for b in dna.upper() if b in "GC") / len(dna)
    return lo <= gc <= hi


def check_homopolymers(dna, max_run=3):
    """Quick homopolymer check."""
    dna = dna.upper()
    if len(dna) < 2:
        return True
    run = 1
    for i in range(1, len(dna)):
        if dna[i] == dna[i-1]:
            run += 1
            if run > max_run:
                return False
        else:
            run = 1
    return True


def passes_constraints(dna):
    """Return True if the DNA sequence passes GC + homopolymer checks."""
    return check_gc_content(dna) and check_homopolymers(dna)


def encode_fragment_constrained(hex_frag, encoding_type="4base"):
    """
    Encode a single hex fragment to DNA.
    If the result fails constraints, try scrambling with different seeds.
    Returns (dna_string, seed_index, pad).
    pad is only used for 6-base encoding.
    """
    best_dna = None
    best_seed = 0
    best_pad = 0

    for seed_idx, seed in enumerate(SCRAMBLE_SEEDS):
        scrambled = scramble_hex(hex_frag, seed)

        if encoding_type == "6base":
            dna, pad = hex_to_dna_6(scrambled)
        else:
            dna = hex_to_dna_encode_4(scrambled)
            pad = 0

        # Apply existing constraint fixes (homopolymer smoothing etc.)
        dna = apply_dna_constraints(dna, encoding_type)

        if passes_constraints(dna):
            return dna, seed_idx, pad

        # Keep first result as fallback
        if best_dna is None:
            best_dna = dna
            best_seed = seed_idx
            best_pad = pad

    # If no seed produces a passing result, use the original (seed 0)
    # The constraints panel will flag these — but data integrity is preserved
    return best_dna, best_seed, best_pad


# =========================
# FILE ENCODING (IMPROVED)
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

    # STEP 6: Constraint-aware DNA encoding
    print(f"[5/7] DNA encoding (constraint-aware)...")
    passed = 0
    retried = 0
    chunk_id = 0

    for frag in fragments:
        dna, seed_idx, pad = encode_fragment_constrained(frag, encoding_type)

        # Metadata: chunk_id:index:seed[:pad]
        # seed is always stored so the decoder knows how to reverse the scramble
        if encoding_type == "6base":
            meta = f"{chunk_id}:{str(index).zfill(8)}:{seed_idx}:{pad}"
        else:
            meta = f"{chunk_id}:{str(index).zfill(8)}:{seed_idx}"

        dna = FORWARD_PRIMER + dna + REVERSE_PRIMER
        dna_fragments.append(f"{meta}|{dna}")

        if seed_idx == 0:
            passed += 1
        else:
            retried += 1
        index += 1

    total = passed + retried
    print(f"[6/7] Constraint results: {passed} passed on first try, {retried} needed re-encoding")
    print(f"[7/7] Done — {len(dna_fragments)} fragments")
    return dna_fragments, file_hash, filename


# =========================
# FILE DECODING (UPDATED)
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

            # Handle both old format (no seed) and new format (with seed)
            seed_idx = 0
            pad = 0
            if len(parts) == 3:
                # Could be old format chunk:idx:pad OR new format chunk:idx:seed
                # For 4-base old format: parts[2] is not used (was absent)
                # For 6-base old format: parts[2] is pad
                # For new 4-base format: parts[2] is seed
                # We detect: if encoding is 6base and only 3 parts, treat as old pad format
                if encoding_type == "6base":
                    pad = int(parts[2])
                    seed_idx = 0  # old format, no seed
                else:
                    seed_idx = int(parts[2])
            elif len(parts) == 4:
                # New 6-base format: chunk:idx:seed:pad
                seed_idx = int(parts[2])
                pad = int(parts[3])
            elif len(parts) == 2:
                # Old 4-base format: chunk:idx
                seed_idx = 0
                pad = 0

            if dna.startswith(FORWARD_PRIMER):
                dna = dna[len(FORWARD_PRIMER):]
            if dna.endswith(REVERSE_PRIMER):
                dna = dna[:-len(REVERSE_PRIMER)]

            parsed.append((chunk_id, idx, dna, pad, seed_idx))
        except:
            continue

    parsed.sort(key=lambda x: (x[0], x[1]))

    # Group by chunk
    chunks = {}
    for chunk_id, idx, dna, pad, seed_idx in parsed:
        if chunk_id not in chunks:
            chunks[chunk_id] = []
        chunks[chunk_id].append((idx, dna, pad, seed_idx))

    full_hex = ""
    for chunk_id in sorted(chunks.keys()):
        chunk_frags = chunks[chunk_id]
        chunk_frags.sort(key=lambda x: x[0])

        # Skip last fragment (XOR redundancy)
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

                # Reverse the scramble if a non-zero seed was used
                if seed_idx > 0 and seed_idx < len(SCRAMBLE_SEEDS):
                    hex_frag = unscramble_hex(hex_frag, SCRAMBLE_SEEDS[seed_idx])

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
