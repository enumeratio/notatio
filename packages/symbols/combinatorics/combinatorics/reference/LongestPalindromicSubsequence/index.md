---
name: LongestPalindromicSubsequence
domain: Binary word statistics
signature: LongestPalindromicSubsequence(word)
summary: The length of the longest subsequence that reads the same backwards.
catalog:
  - system: findstat
    identity: St001417
    url: https://www.findstat.org/St001417
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: LongestPalindromicSubsequence(word)
    description: The length of the longest subsequence that reads the same backwards.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001417: the longest common subsequence of the word and its reverse. After the first i letters, entry j + 1 holds that for the first j letters of the reverse.
