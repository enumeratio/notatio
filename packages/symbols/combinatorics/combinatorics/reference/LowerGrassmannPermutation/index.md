---
name: LowerGrassmannPermutation
domain: Combinatorial maps
signature: LowerGrassmannPermutation(DecoratedPermutation)
summary: "The lower bound u of the Grassmann interval [u, v] of a decorated permutation w: u = wv, the entries of w read first at the anti-exceedance positions and then at the rest."
catalog:
  - system: findstat
    identity: Mp00255
    url: https://www.findstat.org/Mp00255
    on: DecoratedPermutation
mapOn:
  - DecoratedPermutation
signatures:
  - call: LowerGrassmannPermutation(DecoratedPermutation)
    description: "The lower bound u of the Grassmann interval [u, v] of a decorated permutation w: u = wv, the entries of w read first at the anti-exceedance positions and then at the rest."
    library: enumeratio-combinatorics
    type: (decorated_permutation) -> permutation
---

- Takes a `DecoratedPermutation` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00255. The anti-exceedance positions are those p with w(p) < p, and the fixed points decorated +. Not injective.
