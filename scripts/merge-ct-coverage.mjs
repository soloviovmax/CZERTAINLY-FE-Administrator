// Merges the raw coverage records of sharded component-test runs into the one lcov Sonar reads.
//
//   node scripts/merge-ct-coverage.mjs <raw-dir> [<raw-dir> ...]
//
// Each argument is a `coverage-playwright/raw` directory one shard produced. The merged lcov lands where an
// unsharded run writes it, coverage-playwright/lcov.info, so scripts/clean-lcov.js and Sonar read it unchanged.

import fs from 'node:fs';
import { CoverageReport } from 'monocart-coverage-reports';
import { ctCoverageOptions, ctCoverageSourceFilter, ctCoverageSourcePath } from './ct-coverage.mjs';

const inputDir = process.argv.slice(2);
if (inputDir.length === 0) {
    console.error('usage: node scripts/merge-ct-coverage.mjs <raw-dir> [<raw-dir> ...]');
    process.exit(2);
}
const missing = inputDir.filter((dir) => !fs.existsSync(dir));
if (missing.length > 0) {
    console.error(`raw coverage directories not found: ${missing.join(', ')}`);
    process.exit(2);
}

const results = await new CoverageReport({
    name: 'CT Coverage',
    inputDir,
    outputDir: ctCoverageOptions.outputDir,
    reports: ['lcovonly', 'text-summary'],
    sourcePath: ctCoverageSourcePath,
    sourceFilter: ctCoverageSourceFilter,
}).generate();

console.log(`Merged ${inputDir.length} raw coverage directories: ${results.files.length} source files`);
