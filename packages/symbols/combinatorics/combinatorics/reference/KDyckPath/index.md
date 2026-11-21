---
name: KDyckPath
domain: Combinatorics
signature: KDyckPath(steps)
summary: "A $k$-Dyck path, as its steps: 1 for a step up by $k$, 0 for a step down by 1."
catalogCarrier: true
signatures:
  - call: KDyckPath(steps)
    description: "A $k$-Dyck path, as its steps: 1 for a step up by $k$, 0 for a step down by 1."
    library: enumeratio-combinatorics
    type: (list<integer>) -> k_dyck_path
---

- The list is the path's steps, left to right: 1 rises by $k$ and 0 falls by 1. The path never goes below the ground and ends on it, so a path of semilength $n$ has $n$ ones and $kn$ zeros. The list does not hold $k$: $(1, 0, 0)$ is a 2-Dyck path and $(1, 0)$ a 1-Dyck path, and `Element(x, KDyckPaths(n, k))` asks which.
- `KDyckPath([1, 0, 1, 0, 0, 0])` is a 2-Dyck path of semilength 2: up 2, down 1, up 2, down 3 in single steps.
- With $k = 1$ these are the [[DyckPath]]s, step for step.
- The family [[KDyckPaths]] lists them.
