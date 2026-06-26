import fs from "node:fs";
import path from "node:path";
import libCoverage from "istanbul-lib-coverage";
import libReport from "istanbul-lib-report";
import reports from "istanbul-reports";

const PROJECT_ROOT = path.resolve(".");
const COVERAGE_TMP_DIR = path.join(PROJECT_ROOT, ".coverage-tmp");
const COVERAGE_DIR = path.join(PROJECT_ROOT, "coverage");

const coverageMap = libCoverage.createCoverageMap({});

if (!fs.existsSync(COVERAGE_TMP_DIR)) {
  console.error("No existe .coverage-tmp. Corré primero los tests.");
  process.exit(1);
}

const files = fs
  .readdirSync(COVERAGE_TMP_DIR)
  .filter(file => file.endsWith(".json"));

for (const file of files) {
  const fullPath = path.join(COVERAGE_TMP_DIR, file);
  const raw = fs.readFileSync(fullPath, "utf8");
  const coverage = JSON.parse(raw);

  coverageMap.merge(coverage);
}

if (coverageMap.files().length === 0) {
  console.error("No se encontró coverage para reportar.");
  process.exit(1);
}

const context = libReport.createContext({
  dir: COVERAGE_DIR,
  coverageMap
});

reports.create("text").execute(context);
reports.create("html").execute(context);
reports.create("json-summary").execute(context);

console.log(`Reporte HTML generado en: ${path.join(COVERAGE_DIR, "index.html")}`);