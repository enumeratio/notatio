---
name: HookFactorizationPrefixLength
domain: Permutation statistics
signature: HookFactorizationPrefixLength(p)
summary: The length of the leading increasing factor p of the hook factorization p t1 ... tk.
catalog:
  - system: findstat
    identity: St000338
    url: https://www.findstat.org/St000338
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: HookFactorizationPrefixLength(p)
    description: The length of the leading increasing factor p of the hook factorization p t1 ... tk.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
- Hook factors are cut from the right, each from a descent top.
