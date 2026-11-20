"""Collect mpmath's orthogonal polynomials, for the bignum recurrence (@notatio/ce-patches orthogonal-recurrence.ts).

Writes tests/orthogonal-recurrence.mpmath.json: each row is a family, a degree n, a Laguerre parameter a, an exact
decimal x (a real and an imaginary part, as strings) and mpmath's value at 120 working digits, written to 70.

  families: chebyt, chebyu, hermite, laguerre (a = 0 and a = 5/2), legendre;
  n = 0, 1, 2, 5, 20, 100;
  x = a decimal of 25 digits next to the largest zero of the polynomial (so the value is tiny against its terms),
      1e-20, 1 + 1e-20, 0.5, 3, 100, and the complex 0.3 + 0.7 i.

Run: python3 -I packages/symbols/analysis/analytic/scripts/collect-orthogonal-recurrence-mpmath.py (mpmath 1.3).
"""

import json
import pathlib
from fractions import Fraction

from mpmath import chebyt, chebyu, cos, hermite, laguerre, legendre, mp, mpc, mpf, nstr, pi, sqrt

mp.dps = 120
OUT = pathlib.Path(__file__).resolve().parent.parent / "tests" / "orthogonal-recurrence.mpmath.json"

FAMILIES = {
    "ChebyshevT": (lambda n, a, x: chebyt(n, x), "T"),
    "ChebyshevU": (lambda n, a, x: chebyu(n, x), "U"),
    "HermiteH": (lambda n, a, x: hermite(n, x), "H"),
    "LaguerreL": (lambda n, a, x: laguerre(n, a, x), "L"),
    "LegendrePolynomial": (lambda n, a, x: legendre(n, x), "P"),
}
DEGREES = [0, 1, 2, 5, 20, 100]
PARAMETERS = {"LaguerreL": ["0", "2.5"]}
X_TEXT = ["1e-20", "1.00000000000000000001", "0.5", "3", "100"]


def recurrence(name, n, a, x):
    """p_n(x) by the three-term recurrence at the working digits: only locates a zero, never an oracle value."""
    p, c = mpf(1), {"ChebyshevT": x, "ChebyshevU": 2 * x, "HermiteH": 2 * x, "LaguerreL": 1 + a - x, "LegendrePolynomial": x}[name]
    for k in range(1, n):
        if name in ("ChebyshevT", "ChebyshevU"):
            nxt = 2 * x * c - p
        elif name == "HermiteH":
            nxt = 2 * x * c - 2 * k * p
        elif name == "LaguerreL":
            nxt = ((2 * k + 1 + a - x) * c - (k + a) * p) / (k + 1)
        else:
            nxt = ((2 * k + 1) * x * c - k * p) / (k + 1)
        p, c = c, nxt
    return c if n >= 1 else p


def zero(name, n, a):
    """The largest zero of the polynomial of degree n >= 1, found by a sign scan from above and refined."""
    f = lambda x: recurrence(name, n, a, x)
    if name == "ChebyshevT":
        return cos(pi / (2 * n))
    if name == "ChebyshevU":
        return cos(pi / (n + 1))
    top = {"HermiteH": sqrt(2 * n + 1) * 2, "LaguerreL": mpf(4 * n + 2 + 2 * a), "LegendrePolynomial": mpf(1)}[name]
    steps = 4000
    previous = top
    for i in range(1, steps + 1):
        x = top * (1 - mpf(i) / steps)
        if f(x) * f(previous) <= 0:
            if f(x) == 0:
                return x
            lo, hi = x, previous
            for _ in range(400):
                mid = (lo + hi) / 2
                if f(lo) * f(mid) <= 0:
                    hi = mid
                else:
                    lo = mid
            return lo
        previous = x
    raise ValueError((name, n, a))


class Gaussian:
    """A complex number with rational parts, so the recurrence below is exact."""

    def __init__(self, re, im=0):
        self.re, self.im = Fraction(re), Fraction(im)

    def __add__(self, o):
        o = o if isinstance(o, Gaussian) else Gaussian(o)
        return Gaussian(self.re + o.re, self.im + o.im)

    __radd__ = __add__

    def __sub__(self, o):
        o = o if isinstance(o, Gaussian) else Gaussian(o)
        return Gaussian(self.re - o.re, self.im - o.im)

    def __rsub__(self, o):
        return Gaussian(o) - self

    def __mul__(self, o):
        o = o if isinstance(o, Gaussian) else Gaussian(o)
        return Gaussian(self.re * o.re - self.im * o.im, self.re * o.im + self.im * o.re)

    __rmul__ = __mul__

    def __truediv__(self, k):
        return Gaussian(self.re / k, self.im / k)


def exact(name, n, a_text, x_text):
    """p_n(x) in exact rational arithmetic for a decimal x (a pair of decimals): the oracle where mpmath is not.

    mpmath's hypergeometric route fails to converge at an exact zero (U_2(1/2)), and near 0 it is wrong in its
    leading digits (T_1(3.1554e-122) = 3.1578e-122), so every row is checked against this and takes it on a
    disagreement.
    """
    x, a = Gaussian(Fraction(x_text[0]), Fraction(x_text[1])), Fraction(a_text)
    p, c = Gaussian(1), {"ChebyshevT": x, "ChebyshevU": 2 * x, "HermiteH": 2 * x, "LaguerreL": 1 + a - x, "LegendrePolynomial": x}[name]
    if n == 0:
        return mpc(1)
    for k in range(1, n):
        if name in ("ChebyshevT", "ChebyshevU"):
            nxt = 2 * x * c - p
        elif name == "HermiteH":
            nxt = 2 * x * c - 2 * k * p
        elif name == "LaguerreL":
            nxt = ((2 * k + 1 + a - x) * c - (k + a) * p) / (k + 1)
        else:
            nxt = ((2 * k + 1) * x * c - k * p) / (k + 1)
        p, c = c, nxt
    return mpc(mpf(c.re.numerator) / c.re.denominator, mpf(c.im.numerator) / c.im.denominator)


def pair(value):
    value = mpc(value)
    return [nstr(value.real, 70), nstr(value.imag, 70)]


rows = []
corrected = []
for name, (function, _) in FAMILIES.items():
    for a_text in PARAMETERS.get(name, ["0"]):
        a = mpf(a_text)
        for n in DEGREES:
            points = [(text, ["" + text, "0"], mpf(text)) for text in X_TEXT]
            if n >= 1:
                root = nstr(zero(name, n, a), 25, strip_zeros=False)
                points.append(("zero", [root, "0"], mpf(root)))
            points.append(("complex", ["0.3", "0.7"], mpc("0.3", "0.7")))
            for kind, x_text, x in points:
                value = exact(name, n, a_text, x_text)
                try:
                    theirs = mpc(function(n, a, x))
                    if abs(theirs - value) > mpf(10) ** -40 * abs(value):
                        corrected.append((name, n, a_text, kind))
                except ValueError:
                    corrected.append((name, n, a_text, kind))
                rows.append(
                    {
                        "head": name,
                        "n": n,
                        "a": a_text,
                        "x": x_text,
                        "kind": kind,
                        "value": pair(value),
                    }
                )

OUT.write_text(json.dumps({"rows": rows}, indent=1) + "\n")
print(len(rows), "rows;", len(corrected), "where mpmath disagrees with exact rationals or fails:", corrected)
