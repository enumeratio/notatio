---
name: RationalDyckPath
domain: Combinatorics
signature: RationalDyckPath(steps)
summary: "A rational Dyck path, as its steps: 1 for north, 0 for east."
catalogCarrier: true
signatures:
  - call: RationalDyckPath(steps)
    description: "A rational Dyck path, as its steps: 1 for north, 0 for east."
    library: enumeratio-combinatorics
    type: (list<integer>) -> rational_dyck_path
---

- The list is the lattice path's steps from the origin: 1 is a step north, 0 a step east. For the pair $(a, b)$ it has $a$ east and $b$ north steps and stays weakly above the line from $(0, 0)$ to $(a, b)$, that is $a y \ge b x$ at every point $(x, y)$. The list does not hold the pair; `Element(x, RationalDyckPaths(a, b))` asks.
- `RationalDyckPath([1, 0, 1, 0, 0])` goes north, east, north, east, east: the pair $(3, 2)$.
- With $a = b = n$ these are the [[DyckPath]]s of semilength $n$, step for step.
- The family [[RationalDyckPaths]] lists them.
