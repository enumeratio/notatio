"""Collect mpmath's lerchphi next to z = 1, for the series about z = 1 (numerics/lerch-phi-about-one.ts).

Writes tests/lerch-near-one.mpmath.json: each row is exact decimal operands (a real and an imaginary
part, as strings) and mpmath's value at 120 working digits, written to 70.

  z = 1 -/+ 10^-k (k = 9, 12, 16, 20, 30), and z = 0.999999999999 + 0.000000000002 i;
  s = 1/2, 2, 3, -3/2, 1 + i; a = 1, 1/4, 3.
  z > 1 is on the branch cut, where mpmath's value is the lower side's.

Run: python3 -I packages/ce-patches/scripts/collect-lerch-near-one-mpmath.py (mpmath 1.3).
"""

import json
import pathlib

from mpmath import lerchphi, mp, mpc, mpf, nstr

mp.dps = 120
OUT = pathlib.Path(__file__).resolve().parent.parent / "tests" / "lerch-near-one.mpmath.json"

Z_VALUES = []
for k in (9, 12, 16, 20, 30):
    for sign in (1, -1):
        numerator = 10**k + sign
        Z_VALUES.append(([f"{numerator}e-{k}", "0"], mpc(mpf(numerator) / mpf(10) ** k)))
Z_VALUES.append((["0.999999999999", "0.000000000002"], mpc(mpf("0.999999999999"), mpf("0.000000000002"))))
S_VALUES = [
    (["0.5", "0"], mpc(0.5)),
    (["2", "0"], mpc(2)),
    (["3", "0"], mpc(3)),
    (["-1.5", "0"], mpc(-1.5)),
    (["1", "1"], mpc(1, 1)),
]
A_VALUES = [(["1", "0"], mpc(1)), (["0.25", "0"], mpc(0.25)), (["3", "0"], mpc(3))]


def pair(value: mpc) -> list[str]:
    return [nstr(value.real, 70), nstr(value.imag, 70)]


rows = []
for z_text, z in Z_VALUES:
    for s_text, s in S_VALUES:
        for a_text, a in A_VALUES:
            rows.append({"z": z_text, "s": s_text, "a": a_text, "value": pair(mpc(lerchphi(z, s, a)))})

OUT.write_text(json.dumps({"lerch": rows}, indent=1) + "\n")
print(len(rows), "rows")
