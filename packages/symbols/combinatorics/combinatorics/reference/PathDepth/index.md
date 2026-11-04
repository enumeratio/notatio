---
name: PathDepth
domain: Binary word statistics
signature: PathDepth(word)
summary: The most zeros less ones among the prefixes.
catalog:
  - system: findstat
    identity: St000877
    url: https://www.findstat.org/St000877
    on: BinaryWord
statOn:
  - BinaryWord
signatures:
  - call: PathDepth(word)
    description: The most zeros less ones among the prefixes.
    library: enumeratio-combinatorics
    type: (binary_word) -> number
---

- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Reads the word as a path with a 0 a step up and a 1 a step down; the empty prefix counts, so the depth is at least 0.
