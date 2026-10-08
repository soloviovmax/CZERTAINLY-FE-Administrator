// What the component-test coverage keeps and how it names a file, shared by the Playwright config, which records
// coverage per run, and merge-ct-coverage.mjs, which merges the raw records of sharded runs into one lcov.

const OUTPUT_DIR = './coverage-playwright';

/** Trims a bundle path down to the repository-relative source path Sonar reads from lcov. */
export function ctCoverageSourcePath(filePath) {
    const fp = filePath.replaceAll('\\', '/');
    const m = /(^|\/)(src\/.*)$/.exec(fp);
    if (m) return m[2];
    const cwd = process.cwd().replaceAll('\\', '/');
    if (fp.startsWith(`${cwd}/`)) return fp.slice(cwd.length + 1);
    return fp;
}

/** Keeps hand-written sources only: no bundle assets, styles, dependencies, pages or generated types. */
export function ctCoverageSourceFilter(p) {
    if (!p) return false;

    p = p.replaceAll('\\', '/');

    if (p.startsWith('localhost-')) return false;
    if (p.includes('/assets/') || p.includes('assets/')) return false;
    if (p.endsWith('.css')) return false;
    if (p.includes('node_modules')) return false;
    if (p.includes('/_pages/')) return false;
    if (p.includes('/types/openapi/')) return false; // Exclude generated types

    return /^src\/.*\.(ts|tsx|js|jsx)$/.test(p);
}

/**
 * Coverage options for one Playwright run. `raw` keeps the records a sharded run hands to the merge; lcov is what
 * Sonar reads, written here as well so an unsharded run (local `npm run test:cov`) needs no merge step.
 */
export const ctCoverageOptions = {
    outputDir: OUTPUT_DIR,
    reports: ['raw', 'lcovonly', 'text-summary'],
    sourcePath: ctCoverageSourcePath,
    sourceFilter: ctCoverageSourceFilter,
};
