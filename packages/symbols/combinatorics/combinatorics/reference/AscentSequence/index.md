---
name: AscentSequence
domain: Combinatorics
signature: AscentSequence(entries)
summary: An ascent sequence, with $x_1 = 0$ and each entry at most one more than the ascents before it.
catalogCarrier: true
signatures:
  - call: AscentSequence(entries)
    description: An ascent sequence, with $x_1 = 0$ and each entry at most one more than the ascents before it.
    library: enumeratio-combinatorics
    type: (list<integer>) -> ascent_sequence
---

- The list holds $x_1, \dots, x_n$ with $x_1 = 0$ and $0 \le x_i \le 1 + \mathrm{asc}(x_1, \dots, x_{i-1})$, where $\mathrm{asc}$ counts the positions $j$ with $x_j < x_{j+1}$. The empty list is the one of length 0.
- `AscentSequence([0, 1, 0, 2])` is allowed: its last entry is at most $1 + 1$, the one ascent before it.
- The family [[AscentSequences]] lists the ascent sequences of length $n$.
