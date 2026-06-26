import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(".");
const COVERAGE_TMP_DIR = path.join(PROJECT_ROOT, ".coverage-tmp");
const COVERAGE_DIR = path.join(PROJECT_ROOT, "coverage");

fs.rmSync(COVERAGE_TMP_DIR, { recursive: true, force: true });
fs.rmSync(COVERAGE_DIR, { recursive: true, force: true });

console.log("Coverage anterior eliminado.");