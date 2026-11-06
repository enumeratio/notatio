---
name: OddPalindromicPrefixHalfLength
domain: Binary word statistics
signature: OddPalindromicPrefixHalfLength(word)
summary: The largest j such that the prefix of length 2 j + 1 is a palindrome.
signatures:
  - call: OddPalindromicPrefixHalfLength(word)
    description: The largest j such that the prefix of length 2 j + 1 is a palindrome.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
catalog:
  - system: findstat
    identity: St001414
    url: https://www.findstat.org/St001414
    on: BinaryWord
statOn:
  - BinaryWord
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001414.
