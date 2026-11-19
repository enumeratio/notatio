---
name: ElementCountMinusWidth
domain: Poset statistics
signature: ElementCountMinusWidth(poset)
summary: The elements less the width.
catalog:
  - system: findstat
    identity: St001668
    url: https://www.findstat.org/St001668
    on: Poset
statOn:
  - Poset
signatures:
  - call: ElementCountMinusWidth(poset)
    description: The elements less the width.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `Length(_x) <= 12` holds; elsewhere the call stays unevaluated.
- FindStat's St001668. The poset with no elements gives 0.
