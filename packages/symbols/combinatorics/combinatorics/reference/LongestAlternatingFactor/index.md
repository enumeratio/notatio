---
name: LongestAlternatingFactor
domain: Binary word statistics
signature: LongestAlternatingFactor(word)
summary: The length of the longest factor in which every two neighboring letters differ.
catalog:
  - system: findstat
    identity: St000983
    url: https://www.findstat.org/St000983
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: LongestAlternatingFactor(word)
    description: The length of the longest factor in which every two neighboring letters differ.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
