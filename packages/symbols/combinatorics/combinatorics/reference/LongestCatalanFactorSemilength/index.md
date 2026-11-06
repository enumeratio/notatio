---
name: LongestCatalanFactorSemilength
domain: Binary word statistics
signature: LongestCatalanFactorSemilength(word)
summary: The semilength of the longest Dyck word in the Catalan factorization.
catalog:
  - system: findstat
    identity: St000875
    url: https://www.findstat.org/St000875
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: LongestCatalanFactorSemilength(word)
    description: The semilength of the longest Dyck word in the Catalan factorization.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000875. Every word is (D 0)^l D (1 D)^m with the D Dyck words; the longest D lies between two critical steps, or an end of the word and one.
