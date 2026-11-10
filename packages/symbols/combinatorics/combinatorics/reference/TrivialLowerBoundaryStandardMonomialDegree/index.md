---
name: TrivialLowerBoundaryStandardMonomialDegree
domain: Dyck path statistics
signature: TrivialLowerBoundaryStandardMonomialDegree(path)
summary: The degree of the standard monomial of the path relative to the trivial lower boundary.
signatures:
  - call: TrivialLowerBoundaryStandardMonomialDegree(path)
    description: The degree of the standard monomial of the path relative to the trivial lower boundary.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001509, as its Sage code walks the path: the blockers are the positions after the first half, spent in order.
