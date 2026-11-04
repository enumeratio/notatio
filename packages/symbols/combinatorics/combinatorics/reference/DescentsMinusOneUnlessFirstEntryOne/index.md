---
name: DescentsMinusOneUnlessFirstEntryOne
domain: Permutation statistics
signature: DescentsMinusOneUnlessFirstEntryOne(p)
summary: The number of descents of p, less one when p(1) is not 1.
catalog:
  - system: findstat
    identity: St001960
    url: https://www.findstat.org/St001960
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: DescentsMinusOneUnlessFirstEntryOne(p)
    description: The number of descents of p, less one when p(1) is not 1.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
