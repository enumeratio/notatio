"""Collect mpmath's values at the points where LerchPhi and Zeta branch on an operand's exact value.

Writes tests/lerch-zeta-branches.mpmath.json: each row is exact decimal operands (a real and an
imaginary part, as strings) and mpmath's value at 100 working digits, written to 60.

lerch: lerchphi(z, s, a), at
  z = 1 -/+ 10^-k (k = 14, 16, 20, 30), s = 1, 2, 1/2, a = 1, 1/4 (z next to the pole of Phi;
  z > 1 is on the branch cut, where mpmath's value is the lower side's);
  z = 0, s = n -/+ 10^-k (n = 0, 1, 2, 3, k = 14, 16, 20, 30), a = -1/2, -5/2, 1/4 and -1/2 + 3i/4
  (Phi(0, s, a) = a^-s on the principal branch).
zeta: zeta(s, a) at a = 10^-k (k = 300, 400, 1000) and s = 2, 3, 1/2, -1, 2 + 3i
  (the k = 0 term a^-s is the value, far past the double range).

Run: python3 -I packages/ce-patches/scripts/collect-lerch-zeta-branches-mpmath.py (mpmath 1.3).
"""

import json
import pathlib

from mpmath import lerchphi, mp, mpc, mpf, nstr, zeta

mp.dps = 100
OUT = pathlib.Path(__file__).resolve().parent.parent / "tests" / "lerch-zeta-branches.mpmath.json"

K_NEAR = [14, 16, 20, 30]


def decimal(numerator: int, k: int) -> str:
    """numerator * 10^-k as the exact decimal string the reader keeps at full precision."""
    return f"{numerator}e-{k}"


def exact(numerator: int, k: int) -> mpf:
    return mpf(numerator) / mpf(10) ** k


def pair(value: mpc) -> list[str]:
    return [nstr(value.real, 60), nstr(value.imag, 60)]


lerch = []
zeta_rows = []

# z next to 1
S_VALUES = [("1", mpf(1)), ("2", mpf(2)), ("0.5", mpf(1) / 2)]
A_VALUES = [("1", mpf(1)), ("0.25", mpf(1) / 4)]
for k in K_NEAR:
    for sign in (1, -1):
        numerator = 10**k + sign
        z = exact(numerator, k)
        for s_text, s in S_VALUES:
            for a_text, a in A_VALUES:
                value = lerchphi(mpc(z), s, a)
                lerch.append(
                    {
                        "z": [decimal(numerator, k), "0"],
                        "s": [s_text, "0"],
                        "a": [a_text, "0"],
                        "value": pair(mpc(value)),
                    }
                )

# z = 0, s next to an integer, a on and off the negative axis
A_AT_ZERO = [
    (("-0.5", "0"), mpc(-0.5)),
    (("-2.5", "0"), mpc(-2.5)),
    (("0.25", "0"), mpc(0.25)),
    (("-0.5", "0.75"), mpc(-0.5, 0.75)),
]
for base in (0, 1, 2, 3):
    for k in K_NEAR:
        for sign in (1, -1):
            numerator = base * 10**k + sign
            s = exact(numerator, k)
            for a_text, a in A_AT_ZERO:
                lerch.append(
                    {
                        "z": ["0", "0"],
                        "s": [decimal(numerator, k), "0"],
                        "a": list(a_text),
                        "value": pair(mpc(lerchphi(mpc(0), s, a))),
                    }
                )

# a below the double's range
for k in (300, 400, 1000):
    a = mpf(10) ** -k
    for s_text, s in [("2", mpc(2)), ("3", mpc(3)), ("0.5", mpc(0.5)), ("-1", mpc(-1)), ("2", mpc(2, 3))]:
        imaginary = "3" if s.imag else "0"
        zeta_rows.append(
            {
                "s": [s_text, imaginary],
                "a": [f"1e-{k}", "0"],
                "value": pair(mpc(zeta(s, a))),
            }
        )

OUT.write_text(json.dumps({"lerch": lerch, "zeta": zeta_rows}, indent=0) + "\n")
print(len(lerch), "lerch rows,", len(zeta_rows), "zeta rows")
