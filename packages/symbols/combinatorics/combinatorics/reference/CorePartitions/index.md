---
name: CorePartitions
domain: Combinatorics
signature: CorePartitions(t, n)
summary: The $t$-cores of $n$, the partitions of $n$ with no hook length divisible by $t$, as a lazy indexed family.
signatures:
  - call: CorePartitions(t, n)
    description: the partitions of $n$ none of whose hook lengths is divisible by $t$, in the order of IntegerPartitions.
    library: enumeratio-combinatorics
    type: (integer<0..>, integer<0..>) -> indexed_collection<core_partition>
seeAlso:
  - IntegerPartitions
  - TransposePartition
references:
  - system: wikipedia
    identity: Core (partition theory)
  - system: oeis
    identity: A033687
  - system: oeis
    identity: A010054
catalog:
  - system: sage
    identity: Cores(k, n)
    url: https://doc.sagemath.org/html/en/reference/combinat/sage/combinat/core.html
grades:
  - name: t
    role: param
  - name: n
    role: axis
carrier: CorePartition
---

- A lazy indexed collection of the partitions of $n$ with no hook divisible by $t$, listed as `IntegerPartitions(n)` lists them (largest part first, reverse lexicographic), so $(4, 2, 1, 1)$ is the one 3-core of 8. Each member is a `CorePartition`.
- A partition is a $t$-core for many $t$ at once, so $t$ belongs to the collection and not to the element: `Element(x, CorePartitions(t, n))` asks the hook condition, and the carrier holds no $t$.
- The count of 3-cores of $n$ is OEIS A033687 ($1, 1, 2, 0, 2, 1, 2, 0, 1, 2, \ldots$), $d_{1,3}(3n+1) - d_{2,3}(3n+1)$; the 2-cores are the staircases $(k, k-1, \ldots, 1)$, one of each triangular size (A010054). In general the counts are the coefficients of $\prod_k (1 - q^{tk})^t / (1 - q^k)$.
- The only 1-core is the empty partition, and for $n < t$ every partition of $n$ is a $t$-core, as no hook exceeds $n$.
