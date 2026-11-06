---
name: SymmetryDegree
domain: Dyck path and binary word statistics
signature: SymmetryDegree(object)
summary: The positions, counting inward from the ends, at which a Dyck path or a binary word agrees with its mirror image.
catalog:
  - system: findstat
    identity: St001523
    url: https://www.findstat.org/St001523
    on: DyckPath
  - system: findstat
    identity: St001524
    url: https://www.findstat.org/St001524
    on: BinaryWord
statOn:
  - BinaryWord
  - DyckPath
signatures:
  - call: SymmetryDegree(path)
    description: The number of step pairs, counting inward from the ends, at which the path agrees in height with its mirror image.
    library: enumeratio-combinatorics
    type: (binary_word | dyck_path) -> number
  - call: SymmetryDegree(word)
    description: The positions i up to half the length where the letters i and n + 1 - i agree.
    library: enumeratio-combinatorics
    type: (binary_word | dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's "degree of symmetry".
- Defined over `BinaryWord` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryWord` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
