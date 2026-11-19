"""Collect mpmath's zeta(s, a) at the points that stress hurwitzZetaBig's plan.

Writes tests/zeta-near-integer.mpmath.json: each row is an exact decimal s and a (a real and an
imaginary part, as strings), and mpmath's value at 150 working digits, written to 70.

The points are s = -n -/+ 10^-k for n = 0, 1, 2, 5, 10 and k = 14, 15, 16, 17, 20, 30 (s next to a
negative integer, where the double rounds onto it), s = 1 -/+ 10^-k (the pole), each at a = 1, 1/4
and 3; s next to -2 and -5 with a small imaginary part; and a = -3 -/+ 10^-30 at s = 2 and 3.

Run: python3 -I packages/ce-patches/scripts/collect-zeta-near-integer-mpmath.py (mpmath 1.3).
"""

import json
import pathlib

from mpmath import mp, mpc, mpf, nstr, zeta

mp.dps = 150
OUT = pathlib.Path(__file__).resolve().parent.parent / "tests" / "zeta-near-integer.mpmath.json"

A_VALUES = [("1", mpf(1)), ("0.25", mpf(1) / 4), ("3", mpf(3))]
K_VALUES = [14, 15, 16, 17, 20, 30]


def decimal(numerator: int, k: int) -> str:
    """numerator * 10^-k as the exact decimal string the reader keeps at full precision."""
    return f"{numerator}e-{k}"


def exact(numerator: int, k: int) -> mpf:
    return mpf(numerator) / mpf(10) ** k


rows = []


def add(s: tuple[str, str], a: tuple[str, str], value: mpc) -> None:
    rows.append(
        {
            "s": list(s),
            "a": list(a),
            "value": [nstr(value.real, 70), nstr(value.imag, 70)],
        }
    )


# s next to a negative integer, and next to the pole at 1
for base in [0, -1, -2, -5, -10, 1]:
    for k in K_VALUES:
        for sign in (1, -1):
            numerator = base * 10**k + sign
            s = exact(numerator, k)
            for a_text, a in A_VALUES:
                add((decimal(numerator, k), "0"), (a_text, "0"), zeta(mpc(s), mpc(a)))

# complex s whose real part is next to a negative integer
for base in (-2, -5):
    for sign in (1, -1):
        for imaginary_k in (20, 1):
            numerator = base * 10**16 + sign
            s = mpc(exact(numerator, 16), exact(1, imaginary_k))
            for a_text, a in A_VALUES[:2]:
                add((decimal(numerator, 16), decimal(1, imaginary_k)), (a_text, "0"), zeta(s, mpc(a)))

# a next to a nonpositive integer: the (k + a) term is the largest, not dropped
for s_value in (2, 3):
    for sign in (1, -1):
        numerator = -3 * 10**30 + sign
        add((str(s_value), "0"), (decimal(numerator, 30), "0"), zeta(mpc(s_value), mpc(exact(numerator, 30))))

OUT.write_text(json.dumps(rows, indent=0) + "\n")
print(len(rows), "rows")
