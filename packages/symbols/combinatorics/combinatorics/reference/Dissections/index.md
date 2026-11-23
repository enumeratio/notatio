---
name: Dissections
domain: Combinatorics
signature: Dissections(n)
summary: The dissections of a convex $(n+2)$-gon by non-crossing diagonals, as a lazy indexed family.
signatures:
  - call: Dissections(n)
    description: the ways to cut a convex polygon with $n + 2$ sides by diagonals that do not cross, each as the diagonals and the number of sides.
    library: enumeratio-combinatorics
    type: (integer<0..>) -> indexed_collection<dissection>
seeAlso:
  - TotalPartitions
references:
  - system: oeis
    identity: A001003
  - system: wikipedia
    identity: Schröder–Hipparchus number
catalog:
  - system: oeis
    identity: A001003
    url: https://oeis.org/A001003
grades:
  - name: n
    role: axis
carrier: Dissection
---

- A dissection holds any number of the diagonals of the polygon with vertices $1, \dots, n+2$, none crossing; the diagonals are written as in [[Dissection]], with the number of sides $n + 2$. They are listed in the order of [[TotalPartitions]]`(n + 1)`: a dissection is the bracketing of the sides other than $(1, n+2)$ (the diagonal $(a, b+1)$ the bracket around the sides $a$ to $b$), so for the square they are no diagonal, then $(2, 4)$, then $(1, 3)$.
- There are $1, 1, 3, 11, 45, 197, 903, \ldots$ of them (little Schröder numbers, Schröder–Hipparchus numbers, OEIS A001003) for $n = 0, 1, 2, \ldots$. The count is the number of [[TotalPartitions]] of $n + 1$.
