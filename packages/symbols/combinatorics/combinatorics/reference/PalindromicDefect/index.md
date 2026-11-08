---
name: PalindromicDefect
domain: Binary word statistics
signature: PalindromicDefect(word)
summary: "The length less the number of distinct nonempty palindromic factors: the palindromes a word of that length can have, one per length plus the empty one, less those it has."
catalog:
  - system: findstat
    identity: St000629
    url: https://www.findstat.org/St000629
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: PalindromicDefect(word)
    description: "The length less the number of distinct nonempty palindromic factors: the palindromes a word of that length can have, one per length plus the empty one, less those it has."
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000629. A word of length n has at most n + 1 distinct palindromic factors, the empty one included.
