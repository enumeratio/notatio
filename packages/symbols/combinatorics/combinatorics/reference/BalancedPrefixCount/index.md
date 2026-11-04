---
name: BalancedPrefixCount
domain: Binary word statistics
signature: BalancedPrefixCount(word)
summary: The nonempty prefixes with as many 0s as 1s.
catalog:
  - system: findstat
    identity: St001355
    url: https://www.findstat.org/St001355
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: BalancedPrefixCount(word)
    description: The nonempty prefixes with as many 0s as 1s.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The returns of the word, read as a lattice path, to the main diagonal.
