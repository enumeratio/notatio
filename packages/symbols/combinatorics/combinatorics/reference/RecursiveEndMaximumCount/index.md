---
name: RecursiveEndMaximumCount
domain: Permutation statistics
signature: RecursiveEndMaximumCount(p)
summary: "FindStat's rix: the number of times, peeling the word, the maximum of what is left is its last entry."
catalog:
  - system: findstat
    identity: St000461
    url: https://www.findstat.org/St000461
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: RecursiveEndMaximumCount(p)
    description: "FindStat's rix: the number of times, peeling the word, the maximum of what is left is its last entry."
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Recursively: the maximum last counts one and the rest is the word without it; the maximum first ends the walk; otherwise the walk goes on with the entries after the maximum (St000461).
