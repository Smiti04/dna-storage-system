"""
DNA Vault — Comparison with Published DNA Storage Methods
=========================================================
Run from your backend/ folder:
    python comparison_table.py

Generates a formatted comparison table for your thesis
comparing DNA Vault with Church (2012), Goldman (2013),
and Erlich/Zielinski DNA Fountain (2017).

Also runs a validation test encoding a file and checking
all constraints meet published synthesis specifications.
"""

import os
import hashlib
import random
from datetime import datetime
from encoder import (
    encode_file, decode_fragments, check_constraints,
    FORWARD_PRIMER, REVERSE_PRIMER
)

def create_test_file(size_bytes=10000, filename="validation_test.bin"):
    rng = random.Random(42)
    data = bytes(rng.randint(0, 255) for _ in range(size_bytes))
    with open(filename, "wb") as f:
        f.write(data)
    return filename, hashlib.sha256(data).hexdigest(), len(data)


def run_validation():
    print("=" * 70)
    print("  DNA VAULT — VALIDATION & COMPARISON REPORT")
    print("  For MSc Thesis")
    print("=" * 70)
    print(f"  Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # ═══════════════════════════════════════════════════════
    # PART 1: ENCODE A TEST FILE AND VALIDATE CONSTRAINTS
    # ═══════════════════════════════════════════════════════

    print(f"\n{'─' * 70}")
    print("  PART 1: CONSTRAINT VALIDATION")
    print(f"{'─' * 70}")

    test_file, orig_hash, orig_size = create_test_file(10000)
    print(f"\n  Test file: {test_file} ({orig_size:,} bytes)")
    print(f"  SHA-256: {orig_hash[:32]}...")

    # Encode
    fragments, file_hash, fname = encode_file(test_file, "4base")
    total = len(fragments)

    # Analyze each fragment
    gc_values = []
    max_homos = []
    lengths = []
    passing = 0
    failing = 0
    restriction_hits = 0

    RESTRICTION_SITES = [
        "GAATTC", "GGATCC", "AAGCTT", "GCGGCCGC", "CTCGAG",
        "GTCGAC", "CTGCAG", "CCCGGG", "GGTACC", "GAGCTC",
        "CATATG", "AGATCT", "TCTAGA", "CCATGG", "GATATC",
    ]

    for raw in fragments:
        pipe_idx = raw.index("|")
        dna = raw[pipe_idx + 1:]
        # Strip primers
        if dna.startswith(FORWARD_PRIMER):
            dna = dna[len(FORWARD_PRIMER):]
        if dna.endswith(REVERSE_PRIMER):
            dna = dna[:-len(REVERSE_PRIMER)]

        length = len(dna)
        lengths.append(length)

        # GC content
        gc = sum(1 for b in dna if b in "GC") / length if length > 0 else 0
        gc_values.append(gc * 100)

        # Max homopolymer
        max_run = 1
        run = 1
        for i in range(1, length):
            if dna[i] == dna[i-1]:
                run += 1
                max_run = max(max_run, run)
            else:
                run = 1
        max_homos.append(max_run)

        # Restriction sites
        for site in RESTRICTION_SITES:
            if site in dna:
                restriction_hits += 1

        # Overall pass
        if check_constraints(dna):
            passing += 1
        else:
            failing += 1

    pass_rate = round(passing / total * 100, 1)
    avg_gc = round(sum(gc_values) / len(gc_values), 2)
    min_gc = round(min(gc_values), 2)
    max_gc = round(max(gc_values), 2)
    avg_len = round(sum(lengths) / len(lengths), 1)
    max_homo = max(max_homos)

    # Compute encoding density
    total_bases = sum(lengths)
    total_data_bits = orig_size * 8
    density = round(total_data_bits / total_bases, 3) if total_bases > 0 else 0

    print(f"\n  RESULTS:")
    print(f"  Total fragments:    {total}")
    print(f"  Avg oligo length:   {avg_len} bases")
    print(f"  Total DNA bases:    {total_bases:,}")
    print(f"  Encoding density:   {density} bits/base")
    print(f"  Pass rate:          {pass_rate}% ({passing}/{total})")
    print(f"  Avg GC content:     {avg_gc}%")
    print(f"  GC range:           {min_gc}% — {max_gc}%")
    print(f"  Max homopolymer:    {max_homo}")
    print(f"  Restriction sites:  {restriction_hits}")

    # Verify decode
    print(f"\n  Decode verification... ", end="")
    decode_fragments(fragments, fname, "4base")
    dp = os.path.join("output_files", fname)
    with open(dp, "rb") as f:
        decoded_hash = hashlib.sha256(f.read()).hexdigest()
    if decoded_hash == orig_hash:
        print("✓ PERFECT RECOVERY")
    else:
        print("✗ DATA MISMATCH")
    os.remove(dp)

    # Synthesis lab compatibility
    print(f"\n  SYNTHESIS LAB COMPATIBILITY:")
    twist_ok = avg_gc >= 25 and avg_gc <= 65 and max_homo <= 6
    idt_ok = avg_gc >= 30 and avg_gc <= 70 and max_homo <= 4
    strict_ok = min_gc >= 35 and max_gc <= 65 and max_homo <= 3 and restriction_hits == 0

    print(f"  Twist Bioscience specs:   {'✓ PASS' if twist_ok else '✗ FAIL'}  (GC 25-65%, homo ≤6)")
    print(f"  IDT specs:                {'✓ PASS' if idt_ok else '✗ FAIL'}  (GC 30-70%, homo ≤4)")
    print(f"  Strict (our target):      {'✓ PASS' if strict_ok else '✗ FAIL'}  (GC 35-65%, homo ≤3, 0 restriction sites)")

    # ═══════════════════════════════════════════════════════
    # PART 2: COMPARISON TABLE
    # ═══════════════════════════════════════════════════════

    print(f"\n\n{'─' * 70}")
    print("  PART 2: COMPARISON WITH PUBLISHED METHODS")
    print(f"{'─' * 70}")

    print(f"""
  ┌──────────────────┬───────────┬──────────┬────────────┬─────────────┬──────────────┐
  │ Method           │ Year      │ Density  │ GC Range   │ Homopolymer │ Error Corr.  │
  │                  │           │ (bit/nt) │            │ Max         │              │
  ├──────────────────┼───────────┼──────────┼────────────┼─────────────┼──────────────┤
  │ Church et al.    │ 2012      │ 1.00     │ ~50%       │ No limit    │ None         │
  │                  │ (Science) │          │ (targeted) │             │              │
  ├──────────────────┼───────────┼──────────┼────────────┼─────────────┼──────────────┤
  │ Goldman et al.   │ 2013      │ 1.58     │ ~50%       │ ≤3          │ 4x overlap   │
  │                  │ (Nature)  │          │ (balanced) │             │ (redundancy) │
  ├──────────────────┼───────────┼──────────┼────────────┼─────────────┼──────────────┤
  │ DNA Fountain     │ 2017      │ 1.57     │ 45-55%     │ ≤3          │ RS + Fountain│
  │ (Erlich)         │ (Science) │          │ (screened) │ (screened)  │ codes        │
  ├──────────────────┼───────────┼──────────┼────────────┼─────────────┼──────────────┤
  │ DNA Vault        │ 2026      │ {density:<8} │ {min_gc:.0f}-{max_gc:.0f}%    │ ≤{max_homo}           │ RS + XOR     │
  │ (This work)      │ (Thesis)  │          │ (enforced) │ (enforced)  │ + Blockchain │
  └──────────────────┴───────────┴──────────┴────────────┴─────────────┴──────────────┘
""")

    print("  KEY DIFFERENCES:")
    print("  • Church (2012): First DNA storage demo, 1 bit/base, no error correction")
    print("  • Goldman (2013): Introduced base-3 encoding to avoid homopolymers, 4x redundancy")
    print("  • DNA Fountain (2017): Seed-based screening (our approach is inspired by this)")
    print("  • DNA Vault (this work): Adds restriction site screening, blockchain verification,")
    print("    6-base epigenetic encoding option, and interactive web-based constraint analysis")

    print(f"\n  UNIQUE CONTRIBUTIONS OF DNA VAULT:")
    print(f"  1. Constraint-aware encoding with seed retry (inspired by DNA Fountain)")
    print(f"  2. 15 restriction enzyme sites actively screened and avoided")
    print(f"  3. Interactive web-based constraint analysis dashboard")
    print(f"  4. FASTA/CSV export for direct synthesis lab submission")
    print(f"  5. 6-base epigenetic encoding (5mC + 6mA) for future nanopore platforms")
    print(f"  6. Blockchain/Merkle tree verification for data integrity")
    print(f"  7. Full-stack web deployment (React + FastAPI)")

    # ═══════════════════════════════════════════════════════
    # PART 3: ENCODING DENSITY ANALYSIS
    # ═══════════════════════════════════════════════════════

    print(f"\n\n{'─' * 70}")
    print("  PART 3: ENCODING DENSITY BREAKDOWN")
    print(f"{'─' * 70}")

    raw_bits = orig_size * 8
    compressed_size = total_bases  # approximate
    overhead_rs = total * 4 * 2  # RS adds 4 bytes per fragment, each = 2 bases
    overhead_primers = total * 20  # 10 + 10 primer bases per fragment
    overhead_xor = lengths[-1] if lengths else 0  # XOR parity fragment

    print(f"\n  Input data:           {raw_bits:>10,} bits ({orig_size:,} bytes)")
    print(f"  Total DNA output:     {total_bases:>10,} bases")
    print(f"  Primer overhead:      {overhead_primers:>10,} bases ({total} fragments x 20)")
    print(f"  RS overhead:          {overhead_rs:>10,} bases (est.)")
    print(f"  XOR parity:           {overhead_xor:>10,} bases (1 fragment)")
    print(f"  Net coding density:   {density:>10.3f} bits/base (gross)")

    theoretical_max = 2.0  # 4 bases = 2 bits/base
    efficiency = round(density / theoretical_max * 100, 1)
    print(f"  Theoretical max:      {theoretical_max:>10.3f} bits/base")
    print(f"  Efficiency:           {efficiency:>10.1f}% of theoretical")

    # Cleanup
    if os.path.exists(test_file):
        os.remove(test_file)

    print(f"\n{'=' * 70}")
    print("  Report complete. Copy these tables into your thesis.")
    print(f"{'=' * 70}\n")


if __name__ == "__main__":
    run_validation()
