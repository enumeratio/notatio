---
name: RunSetFiberSize
domain: Permutation statistics
signature: RunSetFiberSize(p)
summary: The permutations of the same size with the same set of ascending runs as p.
catalog:
  - system: findstat
    identity: St001735
    url: https://www.findstat.org/St001735
    on: Permutation
statOn:
  - Permutation
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The runs can be put in any order that makes each junction a descent.
