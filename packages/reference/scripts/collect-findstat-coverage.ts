// Write the FindStat coverage report (`src/findstat-coverage.json` and `.md`), built, never committed.
//
//   node packages/reference/scripts/collect-findstat-coverage.ts

import { writeFileSync } from "node:fs";
import { referenceData } from "../src/node.ts";
import { coverageMarkdown, findstatCoverage } from "./findstat-coverage.ts";

const coverage = findstatCoverage(referenceData().heads.map(({ entry }) => entry));
const out = (name: string) => new URL(`../src/${name}`, import.meta.url);
writeFileSync(out("findstat-coverage.json"), `${JSON.stringify(coverage, null, 1)}\n`);
writeFileSync(out("findstat-coverage.md"), coverageMarkdown(coverage));
console.log(coverageMarkdown(coverage));
