---
name: HookFactorInversions
domain: Permutation statistics
signature: HookFactorInversions(p)
summary: The inversions summed over the hook factors t1, ..., tk of p.
catalog:
  - system: findstat
    identity: St000337
    url: https://www.findstat.org/St000337
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: HookFactorInversions(p)
    description: The inversions summed over the hook factors t1, ..., tk of p.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
- Called lec.
