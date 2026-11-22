---
name: AscentSequences
domain: Combinatorics
signature: AscentSequences(n)
summary: The ascent sequences of length $n$, counted by the Fishburn numbers, as a lazy indexed family.
signatures:
  - call: AscentSequences(n)
    description: the lists $x_1, \dots, x_n$ with $x_1 = 0$ and $0 \le x_i \le 1 + \mathrm{asc}(x_1, \dots, x_{i-1})$, in lexicographic order.
    library: enumeratio-combinatorics
    type: (integer<0..>) -> indexed_collection<ascent_sequence>
references:
  - system: oeis
    identity: A022493
  - system: wikipedia
    identity: Fishburn number
catalog:
  - system: oeis
    identity: A022493
    url: https://oeis.org/A022493
grades:
  - name: n
    role: axis
carrier: AscentSequence
---

- A sequence $x_1, \dots, x_n$ is an ascent sequence when $x_1 = 0$ and each later entry is at most one more than the number of ascents $x_j < x_{j+1}$ before it. They are listed lexicographically; for $n = 3$ they are $(0,0,0), (0,0,1), (0,1,0), (0,1,1), (0,1,2)$.
- The count is the Fishburn number, OEIS A022493: $1, 1, 2, 5, 15, 53, 217, 1014, \ldots$, which also counts the interval orders on $n$ unlabelled points.
