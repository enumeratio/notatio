---
name: ColoredMotzkinPaths
domain: Combinatorics
signature: ColoredMotzkinPaths(n)
summary: The Motzkin paths of length $n$ whose level steps are of two colors, as a lazy indexed family.
signatures:
  - call: ColoredMotzkinPaths(n)
    description: the Motzkin paths of length $n$ with each level step one of two colors, up before the first color of level before the second before down.
    library: enumeratio-combinatorics
    type: (integer<0..>) -> indexed_collection<colored_motzkin_path>
seeAlso:
  - MotzkinPaths
references:
  - system: oeis
    identity: A000108
catalog:
  - system: oeis
    identity: A000108
    url: https://oeis.org/A000108
    note: shifted, n steps give the Catalan number C(n + 1)
grades:
  - name: n
    role: axis
carrier: ColoredMotzkinPath
---

- A path is a word of $n$ steps: 1 up, -1 down, and level steps of two colors written 0 and 2. They are listed with the steps in that order, up (1), level 0, level 2, down (-1).
- There are the Catalan number $C_{n+1}$ of them, OEIS A000108: $1, 2, 5, 14, 42, 132, \ldots$ for $n = 0, 1, 2, \ldots$. With one color the paths are the [[MotzkinPaths]].
