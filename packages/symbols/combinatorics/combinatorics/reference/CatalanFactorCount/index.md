---
name: CatalanFactorCount
domain: Binary word statistics
signature: CatalanFactorCount(word)
summary: "The factors in the Catalan factorization: the critical steps, and the middle Dyck word if it is not empty."
catalog:
  - system: findstat
    identity: St000876
    url: https://www.findstat.org/St000876
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: CatalanFactorCount(word)
    description: "The factors in the Catalan factorization: the critical steps, and the middle Dyck word if it is not empty."
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000876. The middle word is not empty when the height reaches its lowest value more than once.
