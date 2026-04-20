"""
DNA Vault — Error Simulation & Recovery Experiment
===================================================
Run from your backend/ folder:
    python error_simulation.py

Tests Reed-Solomon error correction under realistic conditions.
Outputs results as table + CSV for thesis.
"""

import os
import random
import hashlib
import csv
from datetime import datetime
from encoder import encode_file, decode_fragments, FORWARD_PRIMER, REVERSE_PRIMER

BASES_4 = "ATGC"

def inject_substitutions(dna, rate):
    dna_list = list(dna)
    n = int(len(dna) * rate)
    positions = random.sample(range(len(dna)), min(n, len(dna)))
    for pos in positions:
        orig = dna_list[pos]
        dna_list[pos] = random.choice([b for b in BASES_4 if b != orig])
    return "".join(dna_list), len(positions)

def inject_deletions(dna, rate):
    n = int(len(dna) * rate)
    positions = sorted(random.sample(range(len(dna)), min(n, len(dna))), reverse=True)
    dna_list = list(dna)
    for pos in positions:
        dna_list.pop(pos)
    return "".join(dna_list), len(positions)

def inject_insertions(dna, rate):
    n = int(len(dna) * rate)
    dna_list = list(dna)
    for _ in range(n):
        pos = random.randint(0, len(dna_list))
        dna_list.insert(pos, random.choice(BASES_4))
    return "".join(dna_list), n

def corrupt_fragment(raw, error_type, rate):
    pipe_idx = raw.index("|")
    meta = raw[:pipe_idx]
    dna = raw[pipe_idx + 1:]
    core = dna
    has_fp = dna.startswith(FORWARD_PRIMER)
    has_rp = dna.endswith(REVERSE_PRIMER)
    if has_fp: core = core[len(FORWARD_PRIMER):]
    if has_rp: core = core[:-len(REVERSE_PRIMER)]
    if error_type == "substitution":
        corrupted, n = inject_substitutions(core, rate)
    elif error_type == "deletion":
        corrupted, n = inject_deletions(core, rate)
    elif error_type == "insertion":
        corrupted, n = inject_insertions(core, rate)
    else:
        corrupted, n = core, 0
    rebuilt = ""
    if has_fp: rebuilt += FORWARD_PRIMER
    rebuilt += corrupted
    if has_rp: rebuilt += REVERSE_PRIMER
    return f"{meta}|{rebuilt}", n

def corrupt_fragments(fragments, error_type, rate):
    corrupted = []
    total = 0
    for frag in fragments:
        try:
            c, n = corrupt_fragment(frag, error_type, rate)
            corrupted.append(c)
            total += n
        except:
            corrupted.append(frag)
    return corrupted, total

def create_test_file(size_bytes, filename="test_data.bin"):
    rng = random.Random(42)
    data = bytes(rng.randint(0, 255) for _ in range(size_bytes))
    with open(filename, "wb") as f:
        f.write(data)
    return filename, hashlib.sha256(data).hexdigest(), len(data)

def run_experiment():
    print("=" * 70)
    print("  DNA VAULT — ERROR SIMULATION EXPERIMENT")
    print("=" * 70)
    print(f"  Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    test_sizes = [1000, 5000, 10000]
    error_types = ["substitution", "deletion", "insertion"]
    error_rates = [0.001, 0.005, 0.01, 0.02, 0.05]
    trials = 3
    results = []

    for sz in test_sizes:
        print(f"\n{'─' * 70}")
        print(f"  FILE SIZE: {sz:,} bytes")
        print(f"{'─' * 70}")

        test_file, orig_hash, _ = create_test_file(sz)
        fragments, _, fname = encode_file(test_file, "4base")

        # Baseline check
        print("  Baseline decode... ", end="")
        decode_fragments(fragments, fname, "4base")
        dp = os.path.join("output_files", fname)
        with open(dp, "rb") as f:
            dh = hashlib.sha256(f.read()).hexdigest()
        print("PASS" if dh == orig_hash else "FAIL")
        os.remove(dp)

        for et in error_types:
            print(f"\n  {et.upper()}")
            print(f"  {'Rate':>8}  {'Errors':>8}  {'Success':>10}  {'Status':>8}")
            print(f"  {'─'*8}  {'─'*8}  {'─'*10}  {'─'*8}")

            for rate in error_rates:
                ok = 0
                last_n = 0
                for _ in range(trials):
                    corrupted, n = corrupt_fragments(fragments, et, rate)
                    last_n = n
                    try:
                        decode_fragments(corrupted, fname, "4base")
                        dp = os.path.join("output_files", fname)
                        if os.path.exists(dp):
                            with open(dp, "rb") as f:
                                if hashlib.sha256(f.read()).hexdigest() == orig_hash:
                                    ok += 1
                            os.remove(dp)
                    except:
                        pass

                sr = round(ok / trials * 100, 1)
                st = "PASS" if sr == 100 else ("PARTIAL" if sr > 0 else "FAIL")
                print(f"  {rate*100:>7.1f}%  {last_n:>8}  {ok}/{trials:>7}  {st:>8}")

                results.append({
                    "file_size": sz, "fragments": len(fragments),
                    "error_type": et, "error_rate_pct": f"{rate*100:.1f}%",
                    "errors_injected": last_n, "trials": trials,
                    "successes": ok, "success_rate": sr, "status": st,
                })

        os.remove(test_file)

    # Save CSV
    csv_file = "error_simulation_results.csv"
    with open(csv_file, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=results[0].keys())
        w.writeheader()
        w.writerows(results)

    # Summary
    print(f"\n\n{'=' * 70}")
    print("  SUMMARY FOR THESIS")
    print(f"{'=' * 70}")
    print(f"\n  {'Error Type':<15} {'Rate':<8} {'1KB':<10} {'5KB':<10} {'10KB':<10}")
    print(f"  {'─'*15} {'─'*8} {'─'*10} {'─'*10} {'─'*10}")
    for et in error_types:
        for rate in error_rates:
            row = f"  {et:<15} {rate*100:.1f}%   "
            for sz in test_sizes:
                m = [r for r in results if r["error_type"] == et
                     and r["error_rate_pct"] == f"{rate*100:.1f}%" and r["file_size"] == sz]
                row += f"{m[0]['success_rate']:>6.1f}%   " if m else "   N/A    "
            print(row)

    print(f"\n  Results saved to: {csv_file}")
    print(f"{'=' * 70}\n")

if __name__ == "__main__":
    run_experiment()
