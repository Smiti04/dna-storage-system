import random

def gc_ratio(seq):

    gc = seq.count("G") + seq.count("C")

    return gc / len(seq)


def optimize_gc(seq, target=0.5):

    seq = list(seq)

    for i in range(len(seq)):

        current = gc_ratio("".join(seq))

        if abs(current - target) < 0.05:
            break

        if current < target:

            if seq[i] in ["A", "T"]:
                seq[i] = random.choice(["G", "C"])

        else:

            if seq[i] in ["G", "C"]:
                seq[i] = random.choice(["A", "T"])

    return "".join(seq)