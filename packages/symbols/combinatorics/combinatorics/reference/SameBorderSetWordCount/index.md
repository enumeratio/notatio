---
name: SameBorderSetWordCount
domain: Binary word statistics
signature: SameBorderSetWordCount(word)
summary: The binary words of the same length whose set of proper borders, the proper prefixes that are also suffixes, is this word's.
catalog:
  - system: findstat
    identity: St001885
    url: https://www.findstat.org/St001885
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: SameBorderSetWordCount(word)
    description: The binary words of the same length whose set of proper borders, the proper prefixes that are also suffixes, is this word's.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001885. The words of length k are the numbers 0 .. 2^k - 1 with the letter j at the place 2^(j - 1). The borders match when each length is a border of both or of neither, and the prefixes agree where it is one (the border set lists the prefixes themselves). The words of length 0 and 1 have no proper border, so all 2^k words share the set.
