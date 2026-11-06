---
name: LongestPalindromicFactor
domain: Binary word statistics
signature: LongestPalindromicFactor(word)
summary: The length of the longest factor that reads the same backwards.
catalog:
  - system: findstat
    identity: St001416
    url: https://www.findstat.org/St001416
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: LongestPalindromicFactor(word)
    description: The length of the longest factor that reads the same backwards.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001416.
