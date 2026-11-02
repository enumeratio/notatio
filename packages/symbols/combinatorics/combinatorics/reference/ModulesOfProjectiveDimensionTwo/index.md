---
name: ModulesOfProjectiveDimensionTwo
domain: Dyck path statistics
signature: ModulesOfProjectiveDimensionTwo(path)
summary: The indecomposable modules of projective dimension two.
catalog:
  - system: findstat
    identity: St001232
    url: https://www.findstat.org/St001232
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: ModulesOfProjectiveDimensionTwo(path)
    description: The indecomposable modules of projective dimension two.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001232 is stated, and crawled, only for algebras of global dimension at most two; the count is the same definition on every path.
