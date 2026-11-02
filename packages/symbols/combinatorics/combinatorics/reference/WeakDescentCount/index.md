---
name: WeakDescentCount
domain: Composition statistics
signature: WeakDescentCount(composition)
summary: Positions i with c(i) >= c(i+1).
catalog:
  - system: findstat
    identity: St001777
    url: https://www.findstat.org/St001777
    on: IntegerComposition
statOn:
  - IntegerComposition
signatures:
  - call: WeakDescentCount(composition)
    description: Positions i with c(i) >= c(i+1).
    library: enumeratio-combinatorics
    type: (composition) -> number
---

- Defined over `IntegerComposition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerComposition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
