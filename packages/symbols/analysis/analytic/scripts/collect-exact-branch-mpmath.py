"""Collect mpmath's values where a branch test must read an operand's exact value.

Writes tests/exact-branch-analytic.mpmath.json: each row is a head, its operands as exact decimal
strings, and mpmath's value at 150 working digits, written to 70 (real and imaginary parts).

The points sit next to the special point a head branches on, at distances 10^-k for k = 14, 16, 20, 30
(a double reads them as the point itself) and 10^-400 (below the double's range reads as 0):
  InverseErfc(s)               s = 0, 1, 2 -/+ 10^-k
  ExpIntegralE(n, z)           z = 10^-k at integer n; n = 1, 2 -/+ 10^-k at z = 0 and z = 1/2
  IncompleteEllipticF/E(φ, m)  φ = 10^-k (at m = 1/2); m = 10^-k (at φ = 1/2)
  HypergeometricPFQ({1,1},{2}, z)  z = 10^-k
  BellY(n, k, {x1, …})         x1 = 10^-k
  CarlsonRC(x, y)              y = 10^-k at x = 1

Run: python3 -I packages/symbols/analysis/analytic/scripts/collect-exact-branch-mpmath.py (mpmath 1.3).
"""

import json
import pathlib

from mpmath import ellipe, ellipf, elliprc, erfinv, expint, hyp2f1, mp, mpc, mpf, nstr

mp.dps = 150
OUT = pathlib.Path(__file__).resolve().parent.parent / "tests" / "exact-branch-analytic.mpmath.json"
K_VALUES = [14, 16, 20, 30, 400]
K_NEAR = [14, 16, 20, 30]

rows = []


def decimal(numerator: int, k: int) -> str:
    """numerator * 10^-k as an exact decimal string."""
    return f"{numerator}e-{k}"


def exact(text: str) -> mpf:
    return mpf(text)


def add(head: str, args: list[str], value) -> None:
    value = mpc(value)
    rows.append({"head": head, "args": args, "value": [nstr(value.real, 70), nstr(value.imag, 70)]})


# InverseErfc(s) = erfinv(1 - s)
for base in (0, 1, 2):
    for k in K_NEAR:
        for sign in (1, -1):
            if (base == 0 and sign == -1) or (base == 2 and sign == 1):
                continue  # outside [0, 2]
            numerator = base * 10**k + sign
            s = decimal(numerator, k)
            add("InverseErfc", [s], erfinv(1 - exact(s)))
mp.dps = 600  # 1 - 1e-400 needs more than 400 digits
add("InverseErfc", ["1e-100"], erfinv(1 - exact("1e-100")))
add("InverseErfc", ["1e-400"], erfinv(1 - exact("1e-400")))
mp.dps = 150

# ExpIntegralE(n, z)
for n in (1, 2, 3):
    for k in K_VALUES:
        z = f"1e-{k}"
        add("ExpIntegralE", [str(n), z], expint(n, exact(z)))
for base in (1, 2):
    for k in K_NEAR:
        for sign in (1, -1):
            n = decimal(base * 10**k + sign, k)
            if base == 2 or sign == 1:
                add("ExpIntegralE", [n, "0"], 1 / (exact(n) - 1))
            add("ExpIntegralE", [n, "0.5"], expint(exact(n), mpf("0.5")))
for k in K_NEAR:
    n = decimal(1, k)
    add("ExpIntegralE", [n, "0.5"], expint(exact(n), mpf("0.5")))

# IncompleteEllipticF/E(phi, m)
for k in K_VALUES:
    phi = f"1e-{k}"
    add("IncompleteEllipticF", [phi, "0.5"], ellipf(exact(phi), mpf("0.5")))
    add("IncompleteEllipticE", [phi, "0.5"], ellipe(exact(phi), mpf("0.5")))
for k in K_NEAR:
    for sign in (1, -1):
        m = decimal(sign, k)
        add("IncompleteEllipticF", ["0.5", m], ellipf(mpf("0.5"), exact(m)))
        add("IncompleteEllipticE", ["0.5", m], ellipe(mpf("0.5"), exact(m)))

# HypergeometricPFQ({1,1},{2}, z) = 2F1(1,1;2;z) = -ln(1-z)/z
for k in K_VALUES:
    z = f"1e-{k}"
    add("HypergeometricPFQ", ["1", "1", "2", z], hyp2f1(1, 1, 2, exact(z)))

# BellY(2,2,{x}) = x^2, BellY(3,2,{x,y}) = 3xy, BellY(3,3,{x}) = x^3
for k in K_VALUES:
    x = f"1e-{k}"
    add("BellY", ["2", "2", x], exact(x) ** 2)
    add("BellY", ["3", "3", x], exact(x) ** 3)
    add("BellY", ["3", "2", x, x], 3 * exact(x) ** 2)

# CarlsonRC(1, y): a logarithm in y
for k in K_VALUES:
    y = f"1e-{k}"
    add("CarlsonRC", ["1", y], elliprc(1, exact(y)))

OUT.write_text(json.dumps(rows, indent=1) + "\n")
print(f"{len(rows)} rows -> {OUT}")
