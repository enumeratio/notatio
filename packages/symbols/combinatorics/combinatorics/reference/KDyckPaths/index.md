---
name: KDyckPaths
domain: Combinatorics
signature: KDyckPaths(n, k)
summary: The $k$-Dyck paths of semilength $n$, steps up by $k$ and down by 1, as a lazy indexed family.
signatures:
  - call: KDyckPaths(n, k)
    description: the $k$-Dyck paths with $n$ steps up by $k$, listed with the steps up before the steps down.
    library: enumeratio-combinatorics
    type: (integer<0..>, integer<0..>) -> indexed_collection<k_dyck_path>
seeAlso:
  - DyckPaths
references:
  - system: oeis
    identity: A001764
  - system: oeis
    identity: A002293
  - system: wikipedia
    identity: Fuss-Catalan number
grades:
  - name: n
    role: axis
  - name: k
    role: param
carrier: KDyckPath
---

- A $k$-Dyck path of semilength $n$ is a walk of $(k+1)n$ steps, $n$ of them up by $k$ (written 1) and $kn$ of them down by 1 (written 0), that never goes below the ground and ends on it. They are listed with the paths that go up first first, as [[DyckPaths]] lists them, so `KDyckPaths(n, 1)` is `DyckPaths(n)` word for word.
- There are $\frac{1}{kn+1}\binom{(k+1)n}{n}$ of them, the Fuss-Catalan numbers: the Catalan numbers for $k = 1$ (OEIS A000108), $1, 1, 3, 12, 55, 273$ for $k = 2$ (A001764) and $1, 1, 4, 22, 140$ for $k = 3$ (A002293).
- The list holds no $k$, so a word that is a $k$-Dyck path for one $k$ is not one for another: `Element(x, KDyckPaths(n, k))` asks.
