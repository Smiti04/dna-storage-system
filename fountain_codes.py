import random
import hashlib

def generate_droplets(data_chunks, num_droplets):

    droplets = []

    n = len(data_chunks)

    for _ in range(num_droplets):

        degree = random.randint(1, min(5, n))

        chosen = random.sample(data_chunks, degree)

        combined = bytes.fromhex(chosen[0])

        for c in chosen[1:]:

            b = bytes.fromhex(c)

            if len(b) < len(combined):
                b += bytes(len(combined) - len(b))

            combined = bytes(a ^ b for a, b in zip(combined, b))

        seed = random.randint(0, 1_000_000)

        droplet = {
            "seed": seed,
            "degree": degree,
            "data": combined.hex()
        }

        droplets.append(droplet)

    return droplets