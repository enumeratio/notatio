---
name: CornerAlgebraSimplesOfProjectiveDimensionAtMostOne
domain: Dyck path statistics
signature: CornerAlgebraSimplesOfProjectiveDimensionAtMostOne(path)
summary: The simple modules of the corner algebra eAe of projective dimension at most one.
signatures:
  - call: CornerAlgebraSimplesOfProjectiveDimensionAtMostOne(path)
    description: The simple modules of the corner algebra eAe of projective dimension at most one.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001198.
