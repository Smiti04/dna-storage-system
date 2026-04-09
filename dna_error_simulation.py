import random

BASES = ["A", "T", "C", "G"]


def substitution_errors(seq, rate=0.01):

    seq = list(seq)

    for i in range(len(seq)):

        if random.random() < rate:

            choices = [b for b in BASES if b != seq[i]]

            seq[i] = random.choice(choices)

    return "".join(seq)


def insertion_errors(seq, rate=0.005):

    result = ""

    for base in seq:

        result += base

        if random.random() < rate:

            result += random.choice(BASES)

    return result


def deletion_errors(seq, rate=0.005):

    result = ""

    for base in seq:

        if random.random() > rate:

            result += base

    return result


def simulate_synthesis(seq):

    seq = substitution_errors(seq)

    seq = insertion_errors(seq)

    seq = deletion_errors(seq)

    return seq
def simulate_sequencing(seq):

    return substitution_errors(seq, rate=0.02)