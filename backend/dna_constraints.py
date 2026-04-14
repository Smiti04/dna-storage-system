"""
DNA Constraints Analysis — Enhanced
Checks: GC content, homopolymers, melting temperature (nearest-neighbor),
restriction enzyme motifs, sequence complexity (linguistic), base distribution.
"""

import math
from collections import Counter

# ── Restriction enzyme sites to screen ──────────────────────────────
RESTRICTION_SITES = {
    "EcoRI":   "GAATTC",
    "BamHI":   "GGATCC",
    "HindIII": "AAGCTT",
    "NotI":    "GCGGCCGC",
    "XhoI":    "CTCGAG",
    "SalI":    "GTCGAC",
    "PstI":    "CTGCAG",
    "SmaI":    "CCCGGG",
    "KpnI":    "GGTACC",
    "SacI":    "GAGCTC",
    "NdeI":    "CATATG",
    "BglII":   "AGATCT",
    "XbaI":    "TCTAGA",
    "NcoI":    "CCATGG",
    "EcoRV":   "GATATC",
}

# ── Nearest-neighbor thermodynamic params (SantaLucia 1998) ─────────
# ΔH in kcal/mol, ΔS in cal/(mol·K)
NN_PARAMS = {
    "AA": (-7.9, -22.2), "TT": (-7.9, -22.2),
    "AT": (-7.2, -20.4), "TA": (-7.2, -21.3),
    "CA": (-8.5, -22.7), "TG": (-8.5, -22.7),
    "GT": (-8.4, -22.4), "AC": (-8.4, -22.4),
    "CT": (-7.8, -21.0), "AG": (-7.8, -21.0),
    "GA": (-8.2, -22.2), "TC": (-8.2, -22.2),
    "CG": (-10.6, -27.2),
    "GC": (-9.8, -24.4),
    "GG": (-8.0, -19.9), "CC": (-8.0, -19.9),
}
INIT_DH = 0.1   # kcal/mol initiation
INIT_DS = -2.8   # cal/(mol·K) initiation


def calc_gc_content(seq):
    """Return GC fraction (0–1) for a DNA sequence."""
    if not seq:
        return 0.0
    seq = seq.upper()
    gc = sum(1 for b in seq if b in "GC")
    return gc / len(seq)


def find_homopolymers(seq, min_len=3):
    """Return list of {base, length, position} for runs ≥ min_len."""
    seq = seq.upper()
    runs = []
    if not seq:
        return runs
    cur_base = seq[0]
    cur_start = 0
    cur_len = 1
    for i in range(1, len(seq)):
        if seq[i] == cur_base:
            cur_len += 1
        else:
            if cur_len >= min_len:
                runs.append({"base": cur_base, "length": cur_len, "position": cur_start})
            cur_base = seq[i]
            cur_start = i
            cur_len = 1
    if cur_len >= min_len:
        runs.append({"base": cur_base, "length": cur_len, "position": cur_start})
    return runs


def estimate_melting_temp(seq, oligo_conc_nM=250, salt_mM=50):
    """
    Nearest-neighbor melting temperature estimate (°C).
    Uses SantaLucia 1998 unified parameters.
    """
    seq = seq.upper()
    if len(seq) < 2:
        return 0.0
    total_dH = INIT_DH
    total_dS = INIT_DS
    for i in range(len(seq) - 1):
        dinuc = seq[i:i+2]
        if dinuc in NN_PARAMS:
            dH, dS = NN_PARAMS[dinuc]
            total_dH += dH
            total_dS += dS
    # Salt correction (Owczarzy simplified)
    total_dS += 0.368 * len(seq) * math.log(salt_mM / 1000.0)
    R = 1.987  # cal/(mol·K)
    ct = oligo_conc_nM * 1e-9
    if total_dS == 0:
        return 0.0
    tm = (total_dH * 1000.0) / (total_dS + R * math.log(ct / 4.0)) - 273.15
    return round(tm, 1)


def find_restriction_sites(seq):
    """Screen for known restriction enzyme recognition sites."""
    seq = seq.upper()
    found = []
    for name, site in RESTRICTION_SITES.items():
        pos = 0
        while True:
            pos = seq.find(site, pos)
            if pos == -1:
                break
            found.append({"enzyme": name, "site": site, "position": pos})
            pos += 1
    return found


def calc_linguistic_complexity(seq, max_k=4):
    """
    Linguistic complexity: ratio of observed k-mers to possible k-mers.
    Higher = more complex/random. Lower = repetitive.
    Returns value 0–1.
    """
    seq = seq.upper()
    if len(seq) < 2:
        return 0.0
    total_observed = 0
    total_possible = 0
    for k in range(1, min(max_k + 1, len(seq) + 1)):
        observed = len(set(seq[i:i+k] for i in range(len(seq) - k + 1)))
        possible = min(4 ** k, len(seq) - k + 1)
        total_observed += observed
        total_possible += possible
    if total_possible == 0:
        return 0.0
    return round(total_observed / total_possible, 4)


def calc_base_distribution(seq):
    """Return count and percentage for each base."""
    seq = seq.upper()
    counts = Counter(seq)
    total = len(seq) if seq else 1
    dist = {}
    for base in "ATGC":
        c = counts.get(base, 0)
        dist[base] = {"count": c, "percent": round(c / total * 100, 1)}
    # Also capture any non-ATGC bases (6-base encoding uses extra chars)
    other = sum(v for k, v in counts.items() if k not in "ATGC")
    if other > 0:
        dist["other"] = {"count": other, "percent": round(other / total * 100, 1)}
    return dist


def gc_content_along_sequence(seq, window=50):
    """Sliding-window GC content for graphing."""
    seq = seq.upper()
    if len(seq) < window:
        return [{"position": 0, "gc": calc_gc_content(seq)}]
    points = []
    step = max(1, window // 2)
    for i in range(0, len(seq) - window + 1, step):
        chunk = seq[i:i+window]
        gc = calc_gc_content(chunk)
        points.append({"position": i + window // 2, "gc": round(gc, 4)})
    return points


def analyze_constraints(dna_sequence, encoding_type="4-base"):
    """
    Full constraint analysis on a DNA sequence.
    Returns dict with all metrics + pass/fail status.
    """
    seq = dna_sequence.upper()
    length = len(seq)

    # ── GC Content ──
    gc = calc_gc_content(seq)
    gc_pass = 0.35 <= gc <= 0.65

    # ── Homopolymers ──
    homos = find_homopolymers(seq, min_len=3)
    max_homo = max((h["length"] for h in homos), default=0)
    homo_pass = max_homo <= 3

    # ── Melting Temperature ──
    # For long sequences, estimate on first 200 bases (typical oligo range)
    tm_seq = seq[:200] if length > 200 else seq
    tm = estimate_melting_temp(tm_seq)
    # Ideal synthesis range: 50–80°C
    tm_pass = 50 <= tm <= 80

    # ── Restriction Sites ──
    sites = find_restriction_sites(seq)
    motif_pass = len(sites) == 0

    # ── Sequence Complexity ──
    complexity = calc_linguistic_complexity(seq)
    complexity_pass = complexity >= 0.5

    # ── Base Distribution ──
    base_dist = calc_base_distribution(seq)

    # ── GC Sliding Window ──
    gc_profile = gc_content_along_sequence(seq, window=50)

    # ── Overall ──
    all_pass = gc_pass and homo_pass and motif_pass and complexity_pass

    return {
        "length": length,
        "encoding_type": encoding_type,
        "overall_pass": all_pass,
        "gc_content": {
            "value": round(gc, 4),
            "percent": round(gc * 100, 1),
            "pass": gc_pass,
            "range": "35%–65%",
        },
        "homopolymers": {
            "max_run": max_homo,
            "count": len(homos),
            "pass": homo_pass,
            "threshold": 3,
            "details": homos[:20],  # cap at 20 for response size
        },
        "melting_temp": {
            "value_c": tm,
            "pass": tm_pass,
            "range": "50–80 °C",
            "note": "Estimated on first 200 bases" if length > 200 else "Full sequence",
        },
        "restriction_sites": {
            "count": len(sites),
            "pass": motif_pass,
            "found": sites[:20],
        },
        "complexity": {
            "value": complexity,
            "pass": complexity_pass,
            "threshold": 0.5,
            "note": "Linguistic complexity (k-mer diversity ratio)",
        },
        "base_distribution": base_dist,
        "gc_profile": gc_profile,
    }


def analyze_fragments(fragments, encoding_type="4-base"):
    """
    Analyze a list of DNA fragments individually.
    Returns summary + per-fragment analysis.
    """
    results = []
    total_pass = 0
    total_gc = 0.0
    all_homos = 0
    all_sites = 0
    all_tm = []

    for i, frag in enumerate(fragments):
        # Strip primers if present (first 10 and last 10 bases)
        core = frag
        if len(frag) > 20:
            core = frag[10:-10]

        analysis = analyze_constraints(core, encoding_type)
        analysis["fragment_index"] = i
        analysis["has_primers"] = len(frag) > 20
        results.append(analysis)

        if analysis["overall_pass"]:
            total_pass += 1
        total_gc += analysis["gc_content"]["value"]
        all_homos += analysis["homopolymers"]["count"]
        all_sites += analysis["restriction_sites"]["count"]
        all_tm.append(analysis["melting_temp"]["value_c"])

    n = len(fragments) if fragments else 1
    avg_tm = sum(all_tm) / n if all_tm else 0

    summary = {
        "total_fragments": len(fragments),
        "fragments_passing": total_pass,
        "pass_rate": round(total_pass / n * 100, 1),
        "avg_gc": round(total_gc / n, 4),
        "avg_gc_percent": round(total_gc / n * 100, 1),
        "total_homopolymers": all_homos,
        "total_restriction_sites": all_sites,
        "avg_melting_temp": round(avg_tm, 1),
        "encoding_type": encoding_type,
    }

    return {"summary": summary, "fragments": results}
