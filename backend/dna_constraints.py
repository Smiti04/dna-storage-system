import random

# =========================
# GC CONTENT
# =========================
def gc_content(seq, encoding_type="4base"):
    """
    4base: G + C only
    6base: G + C + M (5mC is methylated cytosine → counts as GC)
           X (6mA is methylated adenine → counts as AT)
    """
    if len(seq) == 0:
        return 0

    gc = seq.count("G") + seq.count("C")

    if encoding_type == "6base":
        gc += seq.count("M")  # 5mC counts as GC

    return gc / len(seq)


def balance_gc(seq, encoding_type="4base", lower=0.45, upper=0.55):
    seq = list(seq)

    if encoding_type == "6base":
        gc_bases = ["G", "C", "M"]  # M = 5mC → GC group
        at_bases = ["A", "T", "X"]  # X = 6mA → AT group
    else:
        gc_bases = ["G", "C"]
        at_bases = ["A", "T"]

    for i in range(len(seq)):
        gc = gc_content("".join(seq), encoding_type)
        if lower <= gc <= upper:
            break
        if gc < lower and seq[i] in at_bases:
            seq[i] = random.choice(gc_bases)
        if gc > upper and seq[i] in gc_bases:
            seq[i] = random.choice(at_bases)

    return "".join(seq)


# =========================
# HOMOPOLYMER CONTROL
# =========================
def prevent_homopolymers(seq, encoding_type="4base", max_run=3):
    """
    Prevents runs of more than max_run identical bases.
    Uses correct alphabet depending on encoding type.
    """
    if encoding_type == "6base":
        all_bases = "ACGTMX"
    else:
        all_bases = "ACGT"

    result = ""
    count = 1

    for i in range(len(seq)):
        if i > 0 and seq[i] == seq[i - 1]:
            count += 1
            if count > max_run:
                choices = [b for b in all_bases if b != seq[i]]
                new = random.choice(choices)
                result += new
                count = 1
                continue
        else:
            count = 1
        result += seq[i]

    return result


# =========================
# FULL DNA CONSTRAINT PIPELINE
# =========================
def apply_dna_constraints(seq, encoding_type="4base"):
    seq = balance_gc(seq, encoding_type)
    seq = prevent_homopolymers(seq, encoding_type)
    return seq