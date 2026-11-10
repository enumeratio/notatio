---
name: SocleQuotientInjectiveDimension
domain: Dyck path statistics
signature: SocleQuotientInjectiveDimension(path)
summary: The injective dimension of A/AfA for the path's linear Nakayama algebra A and f the idempotent at the socles of its projective-injective modules.
signatures:
  - call: SocleQuotientInjectiveDimension(path)
    description: The injective dimension of A/AfA for the path's linear Nakayama algebra A and f the idempotent at the socles of its projective-injective modules.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001194
    url: https://www.findstat.org/St001194
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001194, read as the greatest injective dimension over A of the projectives of the quotient that f does not remove.
