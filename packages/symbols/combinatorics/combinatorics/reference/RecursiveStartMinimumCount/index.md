---
name: RecursiveStartMinimumCount
domain: Permutation statistics
signature: RecursiveStartMinimumCount(p)
summary: "FindStat's aix: the number of times, peeling the word, the minimum of what is left is its first entry."
catalog:
  - system: findstat
    identity: St000873
    url: https://www.findstat.org/St000873
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: RecursiveStartMinimumCount(p)
    description: "FindStat's aix: the number of times, peeling the word, the minimum of what is left is its first entry."
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Recursively: the minimum first counts one and the rest is the word without it; the minimum last ends the walk; otherwise the walk goes on with the entries before the minimum (St000873).
