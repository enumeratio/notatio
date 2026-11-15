---
name: MoebiusFunctionSum
domain: Poset statistics
signature: MoebiusFunctionSum(poset)
summary: The sum of the Möbius function μ(x, y) over the pairs x ≤ y.
catalog:
  - system: findstat
    identity: St000914
    url: https://www.findstat.org/St000914
    on: Poset
statOn:
  - Poset
signatures:
  - call: MoebiusFunctionSum(poset)
    description: The sum of the Möbius function μ(x, y) over the pairs x ≤ y.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000914. The poset with no elements gives 0.
