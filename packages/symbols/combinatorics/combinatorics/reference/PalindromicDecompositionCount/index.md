---
name: PalindromicDecompositionCount
domain: Binary word statistics
signature: PalindromicDecompositionCount(word)
summary: The ways to write the word as a concatenation of palindromic factors.
catalog:
  - system: findstat
    identity: St000631
    url: https://www.findstat.org/St000631
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: PalindromicDecompositionCount(word)
    description: The ways to write the word as a concatenation of palindromic factors.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000631. The table holds the ways for each prefix.
