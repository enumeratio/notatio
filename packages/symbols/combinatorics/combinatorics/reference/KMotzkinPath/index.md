---
name: KMotzkinPath
domain: Combinatorics
signature: KMotzkinPath(steps)
summary: A Motzkin path, as its steps, to count by its steps up.
catalogCarrier: true
signatures:
  - call: KMotzkinPath(steps)
    description: A Motzkin path as its steps, 1 up, 0 level, -1 down.
    library: enumeratio-combinatorics
    type: (list<integer>) -> k_motzkin_path
---

- The list holds the steps of a [[MotzkinPath]]: 1 up, 0 level and -1 down, never below the ground and ending on it. The list does not hold its number of steps up, which `Element(x, KMotzkinPaths(n, k))` asks.
- `KMotzkinPath([1, 0, -1])` goes up, along and down.
- The family [[KMotzkinPaths]] lists them by length and steps up.
