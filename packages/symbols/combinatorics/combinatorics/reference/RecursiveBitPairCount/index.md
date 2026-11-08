---
name: RecursiveBitPairCount
domain: Binary word statistics
signature: RecursiveBitPairCount(word)
summary: Dropping the last letter after 00 and the last two otherwise, counting each time, the number of drops of two, with 1 for the word 1.
catalog:
  - system: findstat
    identity: St001984
    url: https://www.findstat.org/St001984
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: RecursiveBitPairCount(word)
    description: Dropping the last letter after 00 and the last two otherwise, counting each time, the number of drops of two, with 1 for the word 1.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001984. Entry j + 1 of the table is the count for the first j letters: the last letter after a 0 is dropped alone, else the last two are dropped for 1.
