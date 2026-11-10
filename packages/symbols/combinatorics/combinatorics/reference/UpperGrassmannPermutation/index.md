---
name: UpperGrassmannPermutation
domain: Combinatorial maps
signature: UpperGrassmannPermutation(DecoratedPermutation)
summary: "The upper bound v of the Grassmann interval [u, v] of a decorated permutation: the anti-exceedance positions in order, then the other positions in order."
catalog:
  - system: findstat
    identity: Mp00256
    url: https://www.findstat.org/Mp00256
    on: DecoratedPermutation
mapOn:
  - DecoratedPermutation
signatures:
  - call: UpperGrassmannPermutation(DecoratedPermutation)
    description: "The upper bound v of the Grassmann interval [u, v] of a decorated permutation: the anti-exceedance positions in order, then the other positions in order."
    library: enumeratio-combinatorics
    type: (decorated_permutation) -> permutation
---

- Takes a `DecoratedPermutation` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00256. v is Grassmannian: it has at most one descent.
