// Lists every statistic whose definition writes an infinity, with the signs its compiled code may answer or the
// rule it fails (src/statistics/infinity.ts).
//
//   node scripts/report-infinite-answers.ts

import { bareEngine } from "@notatio/engine/testing";
import { ALL_STATISTICS } from "../src/statistics/all.ts";
import { infiniteAnswers } from "../src/statistics/infinity.ts";
import { signatureOf } from "../src/statistics/types.ts";

const ce = bareEngine();
for (const definition of ALL_STATISTICS) {
  const verdict = infiniteAnswers(ce, definition);
  if ("failed" in verdict && verdict.failed === 2) continue;
  console.log(
    signatureOf(definition),
    "failed" in verdict ? `off: rule ${verdict.failed}, ${verdict.why}` : `flag: ${verdict.signs.join(", ")}`,
  );
}
