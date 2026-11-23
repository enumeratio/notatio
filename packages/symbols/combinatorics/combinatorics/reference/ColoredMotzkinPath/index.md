---
name: ColoredMotzkinPath
domain: Combinatorics
signature: ColoredMotzkinPath(steps)
summary: A Motzkin path whose level steps are of two colors, as its steps.
catalogCarrier: true
signatures:
  - call: ColoredMotzkinPath(steps)
    description: "A Motzkin path with two colors of level step, as its steps: 1 up, 0 and 2 level, -1 down."
    library: enumeratio-combinatorics
    type: (list<integer>) -> colored_motzkin_path
---

- The list holds the steps of a Motzkin path (see [[MotzkinPath]]) in one word: 1 up, -1 down, and the level steps 0 for one color and 2 for the other. It never goes below the ground and ends on it.
- `ColoredMotzkinPath([0, 2])` is two level steps of different colors.
- The family [[ColoredMotzkinPaths]] lists those of a length.
