---
name: MaximumMoebiusMagnitude
domain: Poset statistics
signature: MaximumMoebiusMagnitude(poset)
summary: The largest |μ(x, y)| of the Möbius function.
catalog:
  - system: findstat
    identity: St001890
    url: https://www.findstat.org/St001890
    on: Poset
statOn:
  - Poset
signatures:
  - call: MaximumMoebiusMagnitude(poset)
    description: The largest |μ(x, y)| of the Möbius function.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001890. The pairs x = y give 1. The poset with no elements gives 0.
