"""
DNA Constraints — Enforcement + Analysis
- apply_dna_constraints(): fixes sequences during encoding
- analyze_constraints(): full analysis for the constraints panel
- analyze_fragments(): batch analysis for multiple fragments
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
INIT_DH = 0.1
INIT_DS = -2.8

# ── Complement maps ─────────────────────────────────────────────────
COMPLEMENT_4 = {"A": "T", "T": "A", "G": "C", "C": "G"}
COMPLEMENT_6 = {"A": "T", "T": "A", "G": "C", "C": "G", "M": "X", "X": "M"}


# ═══════════════════════════════════════════════════════════════════
#  ENFORCEMENT — used during encoding to FIX sequences
# ═══════════════════════════════════════════════════════════════════

def _break_homopolymers(seq, encoding_type="4base", max_run=3):
    """
    Break homopolymer runs > max_run by substituting the offending
    base with its complement.
    """
    comp = COMPLEMENT_6 if encoding_type == "6base" else COMPLEMENT_4
    bases = list(seq.upper())

    if len(bases) < 2:
        return seq

    run_len = 1
    i = 1
    while i < len(bases):
        if bases[i] == bases[i - 1]:
            run_len += 1
            if run_len > max_run:
                old = bases[i]
                bases[i] = comp.get(old, old)
                run_len = 1
        else:
            run_len = 1
        i += 1

    return "".join(bases)


def _balance_gc(seq, encoding_type="4base", target_lo=0.35, target_hi=0.65):
    """
    If GC content is outside target range, swap some bases
    to push it back toward balance.
    """
    comp = COMPLEMENT_6 if encoding_type == "6base" else COMPLEMENT_4
    bases = list(seq.upper())
    length = len(bases)
    if length == 0:
        return seq

    gc_bases = set("GCM") if encoding_type == "6base" else set("GC")
    at_bases = set("ATX") if encoding_type == "6base" else set("AT")

    gc_count = sum(1 for b in bases if b in gc_bases)
    gc_ratio = gc_count / length

    if target_lo <= gc_ratio <= target_hi:
        return "".join(bases)

    if gc_ratio > target_hi:
        # Too GC-rich — swap some G/C → A/T
        excess = gc_count - int(target_hi * length)
        for i in range(length):
            if excess <= 0:
                break
            if bases[i] in gc_bases:
                new_base = comp.get(bases[i], bases[i])
                if new_base in at_bases:
                    bases[i] = new_base
                    excess -= 1
    else:
        # Too AT-rich — swap some A/T → G/C
        deficit = int(target_lo * length) - gc_count
        for i in range(length):
            if deficit <= 0:
                break
            if bases[i] in at_bases:
                new_base = comp.get(bases[i], bases[i])
                if new_base in gc_bases:
                    bases[i] = new_base
                    deficit -= 1

    return "".join(bases)


def _remove_restriction_sites(seq):
    """
    Scan for restriction enzyme recognition sites and break them
    by swapping the middle base to its complement.
    """
    bases = list(seq.upper())
    max_passes = 5
    for _ in range(max_passes):
        changed = False
        seq_str = "".join(bases)
        for name, site in RESTRICTION_SITES.items():
            pos = 0
            while True:
                pos = seq_str.find(site, pos)
                if pos == -1:
                    break
                mid = pos + len(site) // 2
                old = bases[mid]
                bases[mid] = COMPLEMENT_4.get(old, old)
                changed = True
                seq_str = "".join(bases)
                pos += 1
        if not changed:
            break

    return "".join(bases)


def apply_dna_constraints(dna_sequence, encoding_type="4base"):
    """
    Apply all constraint fixes to a DNA sequence:
    1. Break homopolymer runs (max 3 consecutive identical bases)
    2. Balance GC content (35%-65%)
    3. Remove restriction enzyme recognition sites
    4. Re-check homopolymers (previous steps may create new ones)

    Returns the fixed DNA sequence.
    """
    seq = dna_sequence

    # Pass 1: break homopolymers
    seq = _break_homopolymers(seq, encoding_type, max_run=3)

    # Pass 2: balance GC content
    seq = _balance_gc(seq, encoding_type, target_lo=0.35, target_hi=0.65)

    # Pass 3: remove restriction enzyme sites
    seq = _remove_restriction_sites(seq)

    # Pass 4: re-check homopolymers (GC balancing or site removal may create new ones)
    seq = _break_homopolymers(seq, encoding_type, max_run=3)

    return seq


# ═══════════════════════════════════════════════════════════════════
#  ANALYSIS — used by the constraints panel to display results
# ═══════════════════════════════════════════════════════════════════

def calc_gc_content(seq):
    if not seq:
        return 0.0
    seq = seq.upper()
    gc = sum(1 for b in seq if b in "GC")
    return gc / len(seq)


def find_homopolymers(seq, min_len=3):
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
    total_dS += 0.368 * len(seq) * math.log(salt_mM / 1000.0)
    R = 1.987
    ct = oligo_conc_nM * 1e-9
    if total_dS == 0:
        return 0.0
    tm = (total_dH * 1000.0) / (total_dS + R * math.log(ct / 4.0)) - 273.15
    return round(tm, 1)


def find_restriction_sites(seq):
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
    seq = seq.upper()
    counts = Counter(seq)
    total = len(seq) if seq else 1
    dist = {}
    for base in "ATGC":
        c = counts.get(base, 0)
        dist[base] = {"count": c, "percent": round(c / total * 100, 1)}
    other = sum(v for k, v in counts.items() if k not in "ATGC")
    if other > 0:
        dist["other"] = {"count": other, "percent": round(other / total * 100, 1)}
    return dist


def gc_content_along_sequence(seq, window=50):
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
    """Full constraint analysis on a single DNA sequence."""
    seq = dna_sequence.upper()
    length = len(seq)

    gc = calc_gc_content(seq)
    gc_pass = 0.35 <= gc <= 0.65

    homos = find_homopolymers(seq, min_len=3)
    max_homo = max((h["length"] for h in homos), default=0)
    homo_pass = max_homo <= 3

    tm_seq = seq[:200] if length > 200 else seq
    tm = estimate_melting_temp(tm_seq)
    tm_pass = 50 <= tm <= 80

    sites = find_restriction_sites(seq)
    motif_pass = len(sites) == 0

    complexity = calc_linguistic_complexity(seq)
    complexity_pass = complexity >= 0.5

    base_dist = calc_base_distribution(seq)
    gc_profile = gc_content_along_sequence(seq, window=50)

    all_pass = gc_pass and homo_pass and motif_pass and complexity_pass

    return {
        "length": length,
        "encoding_type": encoding_type,
        "overall_pass": all_pass,
        "gc_content": {
            "value": round(gc, 4),
            "percent": round(gc * 100, 1),
            "pass": gc_pass,
            "range": "35%-65%",
        },
        "homopolymers": {
            "max_run": max_homo,
            "count": len(homos),
            "pass": homo_pass,
            "threshold": 3,
            "details": homos[:20],
        },
        "melting_temp": {
            "value_c": tm,
            "pass": tm_pass,
            "range": "50-80 C",
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
    """Analyze a list of DNA fragments. Returns summary + per-fragment."""
    results = []
    total_pass = 0
    total_gc = 0.0
    all_homos = 0
    all_sites = 0
    all_tm = []

    for i, frag in enumerate(fragments):
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
