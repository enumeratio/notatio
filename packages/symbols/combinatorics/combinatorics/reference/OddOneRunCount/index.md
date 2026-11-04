---
name: OddOneRunCount
domain: Binary word statistics
signature: OddOneRunCount(word)
summary: The number of maximal runs of ones of odd length.
catalog:
  - system: findstat
    identity: St000389
    url: https://www.findstat.org/St000389
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: OddOneRunCount(word)
    description: The number of maximal runs of ones of odd length.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
