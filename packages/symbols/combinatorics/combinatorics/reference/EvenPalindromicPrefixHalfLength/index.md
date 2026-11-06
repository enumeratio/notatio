---
name: EvenPalindromicPrefixHalfLength
domain: Binary word statistics
signature: EvenPalindromicPrefixHalfLength(word)
summary: Half the length of the longest palindromic prefix of even length.
signatures:
  - call: EvenPalindromicPrefixHalfLength(word)
    description: Half the length of the longest palindromic prefix of even length.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
catalog:
  - system: findstat
    identity: St001413
    url: https://www.findstat.org/St001413
    on: BinaryWord
statOn:
  - BinaryWord
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001413.
