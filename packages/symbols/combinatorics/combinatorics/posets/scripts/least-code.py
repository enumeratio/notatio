# The least code over the natural labelings of a poset, by brute force, written without the canonical form's search.
# Reads a JSON list of posets (each its lower covers, elements 1..n) on stdin and writes, for each, the number of
# natural labelings (linear extensions), the least code and the poset under it.
#
# The code of a labeled order on 1..n: its pairs (a, b), a < b, in lex order are numbered 1..C(n, 2), pair k is bit
# k - 1 of the code, and the bit is set when a is below b.
import json
import sys


def strict_order(covers):
    n = len(covers)
    below = [set() for _ in range(n)]  # below[y]: every x strictly below y (0-based)
    for y, row in enumerate(covers):
        for c in row:
            below[y] |= {c - 1} | below[c - 1]
    return below


def least_code(covers):
    n = len(covers)
    below = strict_order(covers)
    # bit of the pair (a, b), 1-based labels a < b: C(n, 2) - C(n - a + 1, 2) + (b - a) - 1
    def bit(a, b):
        return (n * (n - 1) // 2) - ((n - a + 1) * (n - a) // 2) + (b - a) - 1

    best = [None, None]
    count = [0]
    placed = []  # placed[k]: the element labeled k + 1

    def extend(code, used):
        k = len(placed)
        if k == n:
            count[0] += 1
            if best[0] is None or code < best[0]:
                best[0], best[1] = code, list(placed)
            return
        for e in range(n):
            if used >> e & 1 or any(not (used >> x & 1) for x in below[e]):
                continue
            c = code
            for a, x in enumerate(placed, start=1):
                if x in below[e]:
                    c |= 1 << bit(a, k + 1)
            placed.append(e)
            extend(c, used | 1 << e)
            placed.pop()

    extend(0, 0)
    order = best[1]
    pos = {e: i + 1 for i, e in enumerate(order)}
    rows = []
    for e in order:
        lower = [x for x in below[e]]
        covers_of = [x for x in lower if not any(x in below[z] for z in lower)]
        rows.append(sorted(pos[x] for x in covers_of))
    return {"extensions": count[0], "code": best[0], "canonical": rows}


if __name__ == "__main__":
    print(json.dumps([least_code(p) for p in json.load(sys.stdin)]))
