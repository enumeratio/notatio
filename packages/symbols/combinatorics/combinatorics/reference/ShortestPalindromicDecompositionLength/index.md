---
name: ShortestPalindromicDecompositionLength
domain: Binary word statistics
signature: ShortestPalindromicDecompositionLength(word)
summary: The fewest palindromic factors the word is a concatenation of.
catalog:
  - system: findstat
    identity: St000630
    url: https://www.findstat.org/St000630
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: ShortestPalindromicDecompositionLength(word)
    description: The fewest palindromic factors the word is a concatenation of.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000630. The table holds the fewest pieces for each prefix.
