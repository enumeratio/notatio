---
name: TotalParkingDisplacement
domain: Parking function statistics
signature: TotalParkingDisplacement(parkingFunction)
summary: "The sum, over the cars, of the spots they drive past: the sum of i - p(i)."
catalog:
  - system: findstat
    identity: St000188
    url: https://www.findstat.org/St000188
    on: ParkingFunction
statOn:
  - ParkingFunction
signatures:
  - call: TotalParkingDisplacement(parkingFunction)
    description: "The sum, over the cars, of the spots they drive past: the sum of i - p(i)."
    library: enumeratio-combinatorics
    type: (parking_function) -> number
---

- Defined over `ParkingFunction` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `ParkingFunction` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000188, which is also the area of the Dyck path of the parking function. Each car's displacement is its spot less its preference and the spots are 1 .. n, so the total is n (n + 1) / 2 less the preferences' sum.
