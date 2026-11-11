---
name: TopQuotientRegularExtensionDimension
domain: Dyck path statistics
signature: TopQuotientRegularExtensionDimension(path)
summary: The dimension of Ext^1(A/AeA, A) for the path's linear Nakayama algebra A and e the idempotent at the tops of its projective-injective modules.
signatures:
  - call: TopQuotientRegularExtensionDimension(path)
    description: The dimension of Ext^1(A/AeA, A) for the path's linear Nakayama algebra A and e the idempotent at the tops of its projective-injective modules.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001193
    url: https://www.findstat.org/St001193
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001193. The quotient's projective at a vertex is the one of A cut where the next kept vertex begins.
