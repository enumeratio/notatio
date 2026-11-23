---
name: Dissection
domain: Combinatorics
signature: Dissection(diagonals, sides)
summary: A dissection of a convex polygon by non-crossing diagonals, as the diagonals' endpoints and the number of sides.
catalogCarrier: true
mapOn:
  - Dissection
signatures:
  - call: Dissection(diagonals, sides)
    description: A dissection of a convex polygon with the given number of sides, by the diagonals listed as a flat list of endpoint pairs.
    library: enumeratio-combinatorics
    type: (tuple<list<integer>, integer>) -> dissection
---

- The polygon has vertices $1, \dots, s$ in order, $s$ the number of sides. The list is the diagonals $(i, j)$ with $i + 2 \le j$, flat as $i_1, j_1, i_2, j_2, \dots$, in order of $i$ and then longest ($j$ largest) first; the side $(1, s)$ is not a diagonal. No two cross.
- `Dissection(Tuple([1, 3], 4))` cuts a square along its diagonal from vertex 1 to vertex 3.
- The family [[Dissections]] lists those of a polygon.
