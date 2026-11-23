---
name: KMotzkinPaths
domain: Combinatorics
signature: KMotzkinPaths(n, k)
summary: The Motzkin paths of length $n$ with $k$ steps up, as a lazy indexed family.
signatures:
  - call: KMotzkinPaths(n, k)
    description: the Motzkin paths of length $n$ with $k$ steps up (and $k$ down), in the order of [[MotzkinPaths]].
    library: enumeratio-combinatorics
    type: (integer<0..>, integer<0..>) -> indexed_collection<k_motzkin_path>
seeAlso:
  - MotzkinPaths
references:
  - system: oeis
    identity: A055151
  - system: oeis
    identity: A001006
catalog:
  - system: oeis
    identity: A055151
    url: https://oeis.org/A055151
grades:
  - name: n
    role: axis
  - name: k
    role: axis
carrier: KMotzkinPath
---

- A path has steps up (1), level (0) and down (-1), never goes below the ground and ends on it; with $k$ steps up it has $k$ down and $n - 2k$ level. They are listed as [[MotzkinPaths]] lists them, up before level before down, so the paths of all $k$ together are `MotzkinPaths(n)`, grouped by $k$.
- The counts are the Motzkin triangle, OEIS A055151: $\binom{n}{2k} C_k$ (Catalan $C_k$) in row $n$, $1; 1; 1, 1; 1, 3; 1, 6, 2; 1, 10, 10; 1, 15, 30, 5$, and a row sums to the Motzkin number $M_n$ (A001006).
