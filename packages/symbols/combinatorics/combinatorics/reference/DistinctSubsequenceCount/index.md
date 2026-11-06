---
name: DistinctSubsequenceCount
domain: Binary word statistics
signature: DistinctSubsequenceCount(word)
summary: The distinct subsequences, the empty one included.
catalog:
  - system: findstat
    identity: St000518
    url: https://www.findstat.org/St000518
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: DistinctSubsequenceCount(word)
    description: The distinct subsequences, the empty one included.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000518. With d(j) the count for the first j letters, d(j) = 2 d(j - 1) less d(p - 1), where p is the latest earlier position holding the same letter, if any.
