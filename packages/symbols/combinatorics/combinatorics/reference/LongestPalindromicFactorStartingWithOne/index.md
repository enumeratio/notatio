---
name: LongestPalindromicFactorStartingWithOne
domain: Binary word statistics
signature: LongestPalindromicFactorStartingWithOne(word)
summary: The length of the longest palindromic factor that begins with a 1.
signatures:
  - call: LongestPalindromicFactorStartingWithOne(word)
    description: The length of the longest palindromic factor that begins with a 1.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
catalog:
  - system: findstat
    identity: St001419
    url: https://www.findstat.org/St001419
    on: BinaryWord
statOn:
  - BinaryWord
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001419.
