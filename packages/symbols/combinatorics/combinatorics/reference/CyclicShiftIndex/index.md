---
name: CyclicShiftIndex
domain: Binary word statistics
signature: CyclicShiftIndex(word)
summary: The position of the word among its distinct cyclic shifts in lexicographic order, from 0.
catalog:
  - system: findstat
    identity: St001436
    url: https://www.findstat.org/St001436
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: CyclicShiftIndex(word)
    description: The position of the word among its distinct cyclic shifts in lexicographic order, from 0.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001436. The shifts are compared as binary numerals, which orders words of one length lexicographically; the table starts with a numeral above every shift's.
