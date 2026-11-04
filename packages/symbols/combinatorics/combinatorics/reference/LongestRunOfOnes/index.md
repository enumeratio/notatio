---
name: LongestRunOfOnes
domain: Binary word statistics
signature: LongestRunOfOnes(word)
summary: The length of the longest run of ones.
catalog:
  - system: findstat
    identity: St000392
    url: https://www.findstat.org/St000392
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: LongestRunOfOnes(word)
    description: The length of the longest run of ones.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
