import hashlib

NODES = [
    "node_A",
    "node_B",
    "node_C",
    "node_D"
]


def assign_node(fragment):

    h = hashlib.sha256(fragment.encode()).hexdigest()

    index = int(h, 16) % len(NODES)

    return NODES[index]


def distribute_fragments(fragments):

    storage_map = {}

    for f in fragments:

        node = assign_node(f)

        if node not in storage_map:
            storage_map[node] = []

        storage_map[node].append(f)

    return storage_map