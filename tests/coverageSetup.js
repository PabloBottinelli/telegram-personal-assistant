import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { afterAll } from "vitest";

const COVERAGE_ENABLED =
    process.env.npm_lifecycle_event === "coverage";

if (COVERAGE_ENABLED) {
    const coverage = {};

    globalThis.__coverage__ = coverage;

    afterAll(() => {
        if (Object.keys(coverage).length === 0) {
            return;
        }

        const dir = path.resolve(".coverage-tmp");

        fs.mkdirSync(dir, {
            recursive: true
        });

        const filename = path.join(
            dir,
            `coverage-${process.pid}-${randomUUID()}.json`
        );

        fs.writeFileSync(
            filename,
            JSON.stringify(coverage),
            "utf8"
        );
    });
}