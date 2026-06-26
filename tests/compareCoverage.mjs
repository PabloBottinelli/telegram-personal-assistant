import fs from "node:fs";

const beforePath = process.argv[2];
const afterPath = process.argv[3];

if (!beforePath || !afterPath) {
  console.error("Uso: node tests/compareCoverage.js before.json after.json");
  process.exit(1);
}

const before = JSON.parse(fs.readFileSync(beforePath, "utf8"));
const after = JSON.parse(fs.readFileSync(afterPath, "utf8"));

const metrics = [
  { key: "lines", label: "Lines" },
  { key: "statements", label: "Statements" },
  { key: "branches", label: "Branches" },
  { key: "functions", label: "Functions" }
];

function pct(summary, metric) {
  return summary?.[metric]?.pct ?? 0;
}

function covered(summary, metric) {
  return summary?.[metric]?.covered ?? 0;
}

function total(summary, metric) {
  return summary?.[metric]?.total ?? 0;
}

function formatDelta(value) {
  if (value > 0) return `+${value.toFixed(2)}%`;
  return `${value.toFixed(2)}%`;
}

function formatCountDelta(value) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

const files = Array.from(
  new Set([
    ...Object.keys(before),
    ...Object.keys(after)
  ])
).filter(file => file !== "total");

const changedFiles = [];

for (const file of files) {
  const beforeFile = before[file] ?? {};
  const afterFile = after[file] ?? {};

  const changes = metrics
    .map(({ key, label }) => {
      const beforePct = pct(beforeFile, key);
      const afterPct = pct(afterFile, key);
      const deltaPct = afterPct - beforePct;

      const beforeCovered = covered(beforeFile, key);
      const afterCovered = covered(afterFile, key);
      const deltaCovered = afterCovered - beforeCovered;

      const beforeTotal = total(beforeFile, key);
      const afterTotal = total(afterFile, key);

      return {
        key,
        label,
        beforePct,
        afterPct,
        deltaPct,
        beforeCovered,
        afterCovered,
        deltaCovered,
        beforeTotal,
        afterTotal
      };
    })
    .filter(change =>
      change.deltaPct !== 0 ||
      change.deltaCovered !== 0 ||
      change.beforeTotal !== change.afterTotal
    );

  if (changes.length > 0) {
    changedFiles.push({
      file,
      changes
    });
  }
}

console.log("\nCoverage diff por archivo\n");

if (changedFiles.length === 0) {
  console.log("No hubo cambios de coverage.");
  process.exit(0);
}

for (const { file, changes } of changedFiles) {
  console.log(file);

  for (const change of changes) {
    console.log(
      `  ${change.label.padEnd(11)} ` +
      `${change.beforePct.toFixed(2)}% -> ${change.afterPct.toFixed(2)}% ` +
      `(${formatDelta(change.deltaPct)}) ` +
      `| cubierto: ${change.beforeCovered}/${change.beforeTotal} -> ` +
      `${change.afterCovered}/${change.afterTotal} ` +
      `(${formatCountDelta(change.deltaCovered)})`
    );
  }

  console.log("");
}

console.log("Total");

for (const { key, label } of metrics) {
  const beforePct = pct(before.total, key);
  const afterPct = pct(after.total, key);
  const deltaPct = afterPct - beforePct;

  const beforeCovered = covered(before.total, key);
  const afterCovered = covered(after.total, key);
  const deltaCovered = afterCovered - beforeCovered;

  const beforeTotal = total(before.total, key);
  const afterTotal = total(after.total, key);

  console.log(
    `  ${label.padEnd(11)} ` +
    `${beforePct.toFixed(2)}% -> ${afterPct.toFixed(2)}% ` +
    `(${formatDelta(deltaPct)}) ` +
    `| cubierto: ${beforeCovered}/${beforeTotal} -> ` +
    `${afterCovered}/${afterTotal} ` +
    `(${formatCountDelta(deltaCovered)})`
  );
}