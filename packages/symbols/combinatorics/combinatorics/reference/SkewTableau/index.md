---
name: SkewTableau
domain: Combinatorics
signature: SkewTableau(tableau)
summary: A standard filling of a skew shape $\lambda/\mu$, as its shape and the row of each entry.
catalogCarrier: true
signatures:
  - call: SkewTableau(tableau)
    description: A standard skew tableau, as the tuple (λ, μ, row word).
    library: enumeratio-combinatorics
    type: (tuple<list<integer>, list<integer>, list<integer>>) -> skew_tableau
---

- A skew tableau is the tuple $(\lambda, \mu, w)$: the outer shape $\lambda$ and the inner shape $\mu$ as lists of row lengths, and the row word $w$, where $w_i$ is the 0-based row that entry $i$ is placed in. Entries $1, \dots, n$ each appear once and rise along rows and down columns. The shape is reduced, as in [[SkewPartitions]]; $\mu = ()$ gives a straight shape.
- `SkewTableau((2, 2), (1), (0, 1, 1))` is the filling of $(2,2)/(1)$ with 1 in the first row and 2, 3 in the second.
- The family [[SkewStandardTableaux]] lists these tuples as plain lists.
