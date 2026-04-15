"""
DNA Vault — Encoder/Decoder Pipeline
=====================================

ENCODING PIPELINE (file → DNA):
  1. READ      — Read raw file bytes
  2. HASH      — SHA-256 hash for integrity verification
  3. COMPRESS  — zlib level 1 (fast, good ratio)
  4. HEX       — Convert compressed bytes to hex string
  5. FRAGMENT  — Split hex into small chunks (150 hex chars → ~150 DNA bases)
                 Real synthesis oligos are 150-300 bases — we match this.
  6. XOR       — Create XOR parity fragment for redundancy
  7. RS ENCODE — Reed-Solomon error correction (10 symbols) per fragment
  8. DNA ENCODE (constraint-aware, DNA Fountain approach):
     a. Convert hex fragment to raw bytes
     b. XOR bytes with a PRNG stream seeded by 'seed=0'
     c. Convert scrambled hex → DNA bases (4-base or 6-base map)
     d. CHECK all constraints (GC 35-65%, homopolymer ≤3, no restriction sites)
     e. If PASS → accept, store seed in metadata
     f. If FAIL → increment seed, go back to (b), retry up to 200 seeds
     g. With ~150-base oligos, a passing seed is found within 1-20 tries
  9. PRIMERS   — Add forward + reverse primers for PCR amplification
  10. STORE    — Save as "chunk_id:index:seed[:pad]|PRIMER+DNA+PRIMER"

DECODING PIPELINE (DNA → file):
  1. PARSE     — Extract metadata (chunk_id, index, seed, pad) and DNA
  2. STRIP     — Remove forward/reverse primers
  3. DNA DECODE — Convert DNA bases back to hex
  4. UNSCRAMBLE — Reverse the PRNG XOR using the stored seed
  5. RS DECODE — Reed-Solomon error correction
  6. REASSEMBLE — Join all fragments in order (skip XOR parity fragment)
  7. DECOMPRESS — zlib decompress
  8. WRITE     — Save reconstructed file

WHY SMALL FRAGMENTS MATTER:
  - Real DNA synthesis produces oligos of 150-300 bases
  - The seed-retry approach works because with ~150 bases,
    the probability of all constraints passing is high
  - With 10,000+ base fragments, no random seed can avoid
    all homopolymer runs — it's statistically impossible
  - Smaller fragments = more fragments, but each one is
    individually valid and can be synthesized independently
"""

import os
import zlib
import hashlib
import random
import reedsolo

# =========================
# REED SOLOMON (reduced to 4 for speed with small fragments)
# =========================
rs = reedsolo.RSCodec(4)

# =========================
# PRIMERS (for PCR amplification)
# =========================
FORWARD_PRIMER = "ACGTACGTAC"
REVERSE_PRIMER = "TGCATGCATG"

# =========================
# RESTRICTION ENZYME SITES
# =========================
RESTRICTION_SITES = [
    "GAATTC", "GGATCC", "AAGCTT", "GCGGCCGC", "CTCGAG",
    "GTCGAC", "CTGCAG", "CCCGGG", "GGTACC", "GAGCTC",
    "CATATG", "AGATCT", "TCTAGA", "CCATGG", "GATATC",
]

# =========================
# 4-BASE ENCODING MAP
# =========================
hex_to_dna_map_4 = {
    "0": "AA", "1": "AT", "2": "AC", "3": "AG",
    "4": "TA", "5": "TT", "6": "TC", "7": "TG",
    "8": "CA", "9": "CT", "a": "CG", "b": "CC",
    "c": "GA", "d": "GT", "e": "GG", "f": "GC"
}
dna_to_hex_map_4 = {v: k for k, v in hex_to_dna_map_4.items()}

# =========================
# 6-BASE ENCODING MAP
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
        dna += hex3_to_base6(hex_string[i:i + 3])
    return dna, pad

def dna_to_hex_6(dna, pad=0):
    hex_string = ''
    for i in range(0, len(dna), 5):
        hex_string += base6_to_hex3(dna[i:i + 5])
    if pad:
        hex_string = hex_string[:-pad]
    return hex_string

# =========================
# 4-BASE CONVERSION
# =========================
def hex_to_dna_encode_4(hex_string):
    return "".join(hex_to_dna_map_4[h] for h in hex_string)

def dna_to_hex_decode_4(dna):
    hex_string = ""
    for i in range(0, len(dna), 2):
        pair = dna[i:i + 2]
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
# XOR PARITY
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


# ═══════════════════════════════════════════════════════════════════
# CONSTRAINT CHECKING
# ═══════════════════════════════════════════════════════════════════

def check_constraints(dna):
    """
    Returns True ONLY if DNA is lab-ready:
    - GC content 35-65%
    - No homopolymer runs > 3
    - No restriction enzyme sites
    """
    n = len(dna)
    if n == 0:
        return True

    gc = 0
    run = 1
    prev = dna[0]
    if prev in ('G', 'C'):
        gc += 1

    for i in range(1, n):
        c = dna[i]
        if c in ('G', 'C'):
            gc += 1
        if c == prev:
            run += 1
            if run > 3:
                return False
        else:
            run = 1
            prev = c

    ratio = gc / n
    if ratio < 0.35 or ratio > 0.65:
        return False

    for site in RESTRICTION_SITES:
        if site in dna:
            return False

    return True


# ═══════════════════════════════════════════════════════════════════
# SEED-BASED SCRAMBLE
# ═══════════════════════════════════════════════════════════════════

def scramble_bytes(data_bytes, seed):
    """XOR with PRNG stream — fully reversible."""
    rng = random.Random(seed)
    mask = bytes(rng.randint(0, 255) for _ in range(len(data_bytes)))
    return bytes(a ^ b for a, b in zip(data_bytes, mask))


# ═══════════════════════════════════════════════════════════════════
# CONSTRAINT-AWARE FRAGMENT ENCODING
# ═══════════════════════════════════════════════════════════════════

MAX_SEEDS = 200

def encode_fragment(hex_frag, encoding_type="4base"):
    """
    Encode hex → DNA that passes ALL constraints.
    Tries up to MAX_SEEDS different scrambles.
    With ~150-base fragments, usually finds a valid seed in 1-20 tries.
    """
    frag_bytes = bytes.fromhex(hex_frag)

    for seed in range(MAX_SEEDS):
        if seed == 0:
            scrambled_hex = hex_frag
        else:
            scrambled_hex = scramble_bytes(frag_bytes, seed).hex()

        if encoding_type == "6base":
            dna, pad = hex_to_dna_6(scrambled_hex)
        else:
            dna = hex_to_dna_encode_4(scrambled_hex)
            pad = 0

        if check_constraints(dna):
            return dna, seed, pad

    # Fallback — should rarely happen with small fragments
    if encoding_type == "6base":
        dna, pad = hex_to_dna_6(hex_frag)
    else:
        dna = hex_to_dna_encode_4(hex_frag)
        pad = 0
    return dna, -1, pad


# ═══════════════════════════════════════════════════════════════════
# FILE ENCODING
# ═══════════════════════════════════════════════════════════════════

def encode_file(file_path, encoding_type="4base"):
    print(f"\n{'='*50}")
    print(f"  DNA VAULT ENCODER — {encoding_type}")
    print(f"{'='*50}")

    filename = os.path.basename(file_path)
    hasher = hashlib.sha256()

    with open(file_path, "rb") as f:
        raw_data = f.read()
    raw_size = len(raw_data)
    print(f"\n[1/8] READ: {filename} ({raw_size:,} bytes)")

    hasher.update(raw_data)
    file_hash = hasher.hexdigest()
    print(f"[2/8] HASH: {file_hash[:16]}...")

    compressed = zlib.compress(raw_data, 1)
    comp_ratio = round((1 - len(compressed) / raw_size) * 100, 1) if raw_size > 0 else 0
    print(f"[3/8] COMPRESS: {raw_size:,} -> {len(compressed):,} bytes ({comp_ratio}% reduction)")

    hex_data = compressed.hex()
    print(f"[4/8] HEX: {len(hex_data):,} hex characters")

    # ── Fragment size: 150 hex chars ──
    # 150 hex = 75 bytes data → after RS(4) = 79 bytes = 158 hex
    # 158 hex → 158 DNA bases (4-base) → + 20 primer bases = 178 total
    # This is within the 150-300 base range that synthesis labs accept
    fragment_size = 150
    fragments = [hex_data[i:i + fragment_size] for i in range(0, len(hex_data), fragment_size)]
    print(f"[5/8] FRAGMENT: {len(fragments)} fragments x {fragment_size} hex chars")

    # XOR parity
    xor_fragment = create_xor_fragment(fragments)
    if xor_fragment:
        fragments.append(xor_fragment)
    print(f"[6/8] XOR PARITY: +1 redundancy -> {len(fragments)} total")

    # Reed-Solomon
    print(f"[7/8] REED-SOLOMON: encoding {len(fragments)} fragments...")
    rs_fragments = []
    for i, f in enumerate(fragments):
        rs_fragments.append(encode_rs(f))
        if (i + 1) % 500 == 0:
            print(f"       RS: {i+1}/{len(fragments)}")
    fragments = rs_fragments

    # Constraint-aware DNA encoding
    print(f"[8/8] DNA ENCODING (constraint-aware, seed retry)...")
    dna_fragments = []
    chunk_id = 0
    passed_first = 0
    passed_retry = 0
    failed = 0
    total_seeds = 0

    for index, frag in enumerate(fragments):
        dna, seed, pad = encode_fragment(frag, encoding_type)

        if encoding_type == "6base":
            meta = f"{chunk_id}:{str(index).zfill(8)}:{seed}:{pad}"
        else:
            meta = f"{chunk_id}:{str(index).zfill(8)}:{seed}"

        full_dna = FORWARD_PRIMER + dna + REVERSE_PRIMER
        dna_fragments.append(f"{meta}|{full_dna}")

        if seed == 0:
            passed_first += 1
        elif seed > 0:
            passed_retry += 1
            total_seeds += seed
        else:
            failed += 1

        if (index + 1) % 500 == 0:
            print(f"       DNA: {index+1}/{len(fragments)}")

    total = passed_first + passed_retry + failed
    pass_rate = round((passed_first + passed_retry) / max(total, 1) * 100, 1)

    print(f"\n{'─'*50}")
    print(f"  ENCODING COMPLETE")
    print(f"{'─'*50}")
    print(f"  Total fragments:  {len(dna_fragments)}")
    print(f"  Passed (seed 0):  {passed_first}")
    print(f"  Passed (retry):   {passed_retry}")
    print(f"  Failed:           {failed}")
    print(f"  Pass rate:        {pass_rate}%")
    if passed_retry > 0:
        print(f"  Avg retry seed:   {round(total_seeds / passed_retry, 1)}")
    print(f"{'─'*50}\n")

    return dna_fragments, file_hash, filename


# ═══════════════════════════════════════════════════════════════════
# FILE DECODING
# ═══════════════════════════════════════════════════════════════════

def decode_fragments(fragments, filename, encoding_type="4base"):
    print(f"\n[DEC] Decoding {len(fragments)} fragments ({encoding_type})")

    parsed = []
    for f in fragments:
        try:
            pipe_idx = f.index('|')
            meta = f[:pipe_idx]
            dna = f[pipe_idx + 1:]
            parts = meta.split(':')

            chunk_id = int(parts[0])
            idx = int(parts[1])
            seed = 0
            pad = 0

            if len(parts) == 2:
                seed = 0
                pad = 0
            elif len(parts) == 3:
                if encoding_type == "6base":
                    val = int(parts[2])
                    if val <= 2:
                        pad = val
                        seed = 0
                    else:
                        seed = val
                        pad = 0
                else:
                    seed = int(parts[2])
            elif len(parts) == 4:
                seed = int(parts[2])
                pad = int(parts[3])

            if dna.startswith(FORWARD_PRIMER):
                dna = dna[len(FORWARD_PRIMER):]
            if dna.endswith(REVERSE_PRIMER):
                dna = dna[:-len(REVERSE_PRIMER)]

            parsed.append((chunk_id, idx, dna, pad, seed))
        except:
            continue

    parsed.sort(key=lambda x: (x[0], x[1]))

    chunks = {}
    for chunk_id, idx, dna, pad, seed in parsed:
        if chunk_id not in chunks:
            chunks[chunk_id] = []
        chunks[chunk_id].append((idx, dna, pad, seed))

    full_hex = ""
    for chunk_id in sorted(chunks.keys()):
        chunk_frags = chunks[chunk_id]
        chunk_frags.sort(key=lambda x: x[0])

        # Skip last fragment (XOR parity)
        if len(chunk_frags) > 1:
            data_frags = chunk_frags[:-1]
        else:
            data_frags = chunk_frags

        for idx, dna, pad, seed in data_frags:
            try:
                if encoding_type == "6base":
                    hex_frag = dna_to_hex_6(dna, pad)
                else:
                    hex_frag = dna_to_hex_decode_4(dna)

                if seed > 0:
                    frag_bytes = bytes.fromhex(hex_frag)
                    hex_frag = scramble_bytes(frag_bytes, seed).hex()

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
        print(f"[DEC] Decompression OK — {len(final_data):,} bytes")
    except Exception as e:
        print(f"[DEC] Decompression failed: {e}")
        final_data = full_binary

    os.makedirs("output_files", exist_ok=True)
    path = os.path.join("output_files", filename)
    with open(path, "wb") as f:
        f.write(final_data)

    print(f"[DEC] Reconstructed: {path} ({len(final_data):,} bytes)")
    return path


# ═══════════════════════════════════════════════════════════════════
# MERKLE TREE
# ═══════════════════════════════════════════════════════════════════

def compute_merkle_root(fragments):
    hashes = [hashlib.sha256(f.encode()).hexdigest() for f in fragments]
    if not hashes:
        return None
    while len(hashes) > 1:
        if len(hashes) % 2 == 1:
            hashes.append(hashes[-1])
        new_hashes = []
        for i in range(0, len(hashes), 2):
            combined = hashes[i] + hashes[i + 1]
            new_hashes.append(hashlib.sha256(combined.encode()).hexdigest())
        hashes = new_hashes
    return hashes[0]
