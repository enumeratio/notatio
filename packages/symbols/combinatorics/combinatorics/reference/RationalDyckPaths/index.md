---
name: RationalDyckPaths
domain: Combinatorics
signature: RationalDyckPaths(a, b)
summary: The lattice paths of $a$ east and $b$ north steps that stay weakly above the line to $(a, b)$, as a lazy indexed family.
signatures:
  - call: RationalDyckPaths(a, b)
    description: the rational Dyck paths of $(a, b)$, listed with the north steps before the east steps.
    library: enumeratio-combinatorics
    type: (integer<0..>, integer<0..>) -> indexed_collection<rational_dyck_path>
seeAlso:
  - DyckPaths
references:
  - system: wikipedia
    identity: Catalan number
  - system: oeis
    identity: A000108
grades:
  - name: a
    role: axis
  - name: b
    role: param
carrier: RationalDyckPath
---

- A rational Dyck path of $(a, b)$ is a lattice path from the origin to $(a, b)$ of $a$ east steps (written 0) and $b$ north steps (written 1) with $a y \ge b x$ at every point $(x, y)$ on it: it never passes below the line through the corner. They are listed with the paths that go north first first, as [[DyckPaths]] lists them, so `RationalDyckPaths(n, n)` is `DyckPaths(n)` word for word.
- When $a$ and $b$ are coprime there are $\frac{1}{a+b}\binom{a+b}{a}$ of them, the rational Catalan number (Bizley), and the paths cannot touch the line between its ends. When they are not, there are more: the paths may touch the line (Bizley's formula), and the family counts those. $(n, n)$ gives the Catalan numbers (OEIS A000108).
- The list holds neither $a$ nor $b$: `Element(x, RationalDyckPaths(a, b))` asks.
