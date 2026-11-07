---
name: CycleAsOneLinePreimageSize
domain: Permutation statistics
signature: CycleAsOneLinePreimageSize(p)
summary: The permutations whose cycles, each from its least point and in order of those, read p as one word.
catalog:
  - system: findstat
    identity: St000279
    url: https://www.findstat.org/St000279
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: CycleAsOneLinePreimageSize(p)
    description: The permutations whose cycles, each from its least point and in order of those, read p as one word.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- A cycle may start at each right-to-left minimum after the first entry, which must be 1.
