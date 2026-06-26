import fs from "node:fs";

const beforePath = process.argv[2];
const afterPath = process.argv[3];

if (!beforePath || !afterPath) {
  console.error("Uso: node tests/compareCoverage.js before.json after.json");
  process.exit(1);
}

const before = JSON.parse(fs.readFileSync(beforePath, "utf8"));
const after = JSON.parse(fs.readFileSync(afterPath, "utf8"));

function pct(obj, key) {
  return obj[key]?.pct ?? 0;
}

const metrics = ["lines", "statements", "functions", "branches"];

console.log("\nCoverage diff\n");

for (const file of Object.keys(after)) {
  if (file === "total") continue;

  const b = before[file] ?? {};
  const a = after[file] ?? {};

  const diffs = metrics
    .map(metric => {
      const delta = pct(a, metric) - pct(b, metric);
      return { metric, delta };
    })
    .filter(x => x.delta !== 0);

  if (diffs.length === 0) continue;

  console.log(file);

  for (const { metric, delta } of diffs) {
    const sign = delta > 0 ? "+" : "";
    console.log(`  ${metric}: ${sign}${delta.toFixed(2)}%`);
  }
}