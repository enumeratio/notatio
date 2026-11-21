---
name: Factorization
domain: Combinatorial maps
signature: Factorization(bases, exponents)
summary: A multiplicative factorization as parallel lists — $\prod \text{bases}_i^{\text{exponents}_i}$ — with `bases` left as `number` rather than `integer`, unlike the prime-specific [[IntegerFactorization]].
signatures:
  - call: Factorization(bases, exponents)
    description: a factorization as parallel `bases`/`exponents` lists
    library: enumeratio-number-theory
    type: ((integer) -> factorization) & ((tuple<list<number>, list<integer>>) -> factorization)
  - call: Factorization(n)
    description: the prime factorization of the integer `n`, as `FactorInteger` finds it, in the form above
    library: enumeratio-number-theory
seeAlso:
  - FactorInteger
  - IntegerFactorization
bindings:
  - origin: mapped
    form: sage
    template: enumeratio_factor_integer($1)
    arity: 1
    note: The integer overload only, Sage's own `factor` read as (base, exponent) pairs with the unit first, as FactorInteger's row; the oracle reads our factorization as those pairs. `Factorization(Tuple(bases, exponents))` is the carrier and has no row.
  - origin: mapped
    form: sympy
    template: sorted(factorint($1).items())
    arity: 1
    note: The integer overload only, SymPy's `factorint` as (base, exponent) pairs. A negative integer's -1 comes first as ours does (sorted); SymPy has no factor for 1, which ours gives as 1^1.
  - origin: mapped
    form: julia
    template: enumeratio_factor_integer($1)
    arity: 1
    note: The integer overload only; Nemo's factorization read as (base, exponent) pairs, as FactorInteger's row.
  - origin: mapped
    form: rust
    template: factor_integer($1)
    arity: 1
    note: The integer overload only; positive operands, as FactorInteger's row.
  - origin: mapped
    form: mathlib4
    template: "(let n : ℕ := $1; (Nat.primeFactorsList n).eraseDups.map fun p => [p, (Nat.primeFactorsList n).count p])"
    arity: 1
    note: The integer overload only; natural n, as FactorInteger's row.
  - origin: mapped
    form: mpmath
    counterpart: false
    arity: 1
    note: mpmath has no integer factoring (its number theory is special functions and primes' counts), so the integer overload gets no mpmath row.
---
