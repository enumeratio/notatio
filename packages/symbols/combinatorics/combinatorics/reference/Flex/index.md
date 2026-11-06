---
name: Flex
domain: Binary word statistics
signature: Flex(word)
summary: The product of the word's lex (its position among its distinct cyclic shifts, from 1) and its frequency.
signatures:
  - call: Flex(word)
    description: The product of the word's lex (its position among its distinct cyclic shifts, from 1) and its frequency.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
catalog:
  - system: findstat
    identity: St001437
    url: https://www.findstat.org/St001437
    on: BinaryWord
statOn:
  - BinaryWord
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001437: St001436 plus 1, times St000627.
