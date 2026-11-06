---
name: LyndonFactorizationLength
domain: Binary word statistics
signature: LyndonFactorizationLength(word)
summary: The factors in the Lyndon factorization.
catalog:
  - system: findstat
    identity: St001267
    url: https://www.findstat.org/St001267
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: LyndonFactorizationLength(word)
    description: The factors in the Lyndon factorization.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001267. A factor starts at each position whose suffix is smaller than every earlier suffix; the table starts with a numeral above any suffix's, and pads a suffix with the digit 0, which is smaller than a letter, so the numerals order the suffixes.
