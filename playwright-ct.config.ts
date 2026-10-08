import { defineConfig, devices } from '@playwright/experimental-ct-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import istanbul from 'vite-plugin-istanbul';
import { ctCoverageOptions } from './scripts/ct-coverage.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    testDir: './src',
    testMatch: '**/*.spec.tsx',
    testIgnore: ['**/*.unit.spec.ts', '**/*.unit.spec.tsx', '**/*.vitest.spec.ts', '**/*.vitest.spec.tsx'],
    timeout: 30 * 1000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 4 : undefined,
    use: {
        trace: 'on-first-retry',
        ctPort: 3100,
        ctViteConfig: {
            define: {
                __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
            },
            plugins: [
                react(),
                tailwindcss(),
                istanbul({
                    include: ['src/**/*.ts', 'src/**/*.tsx'],
                    exclude: ['node_modules', '**/*.spec.ts', '**/*.spec.tsx'],
                    extension: ['.ts', '.tsx'],
                }),
            ],
            resolve: {
                alias: [
                    { find: 'react-hook-form', replacement: path.resolve(__dirname, 'node_modules/react-hook-form/dist/index.esm.mjs') },
                    { find: 'utils/', replacement: path.resolve(__dirname, './src/utils/') + '/' },
                    { find: 'types/', replacement: path.resolve(__dirname, './src/types/') + '/' },
                    { find: 'components/', replacement: path.resolve(__dirname, './src/components/') + '/' },
                    { find: 'ducks/', replacement: path.resolve(__dirname, './src/ducks/') + '/' },
                    { find: 'ducks', replacement: path.resolve(__dirname, './src/ducks') },
                    { find: 'src/', replacement: path.resolve(__dirname, './src/') + '/' },
                    { find: 'playwright/', replacement: path.resolve(__dirname, './playwright/') + '/' },
                ],
                dedupe: ['react', 'react-dom', 'react-hook-form'],
            },
            optimizeDeps: {
                include: ['react-hook-form'],
            },
            build: {
                sourcemap: 'inline',
                minify: false,
                rollupOptions: {
                    output: {
                        sourcemapExcludeSources: false,
                        manualChunks: (id) => {
                            if (id.includes('node_modules/react-hook-form')) return 'vendor-react-hook-form';
                            return undefined;
                        },
                    },
                },
                commonjsOptions: {
                    include: [/react-hook-form/, /node_modules/],
                },
            },
            esbuild: {
                sourcemap: true,
            },
        },
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ],
    // CI shards the run and merges the shards afterwards: the blob report feeds `playwright merge-reports`, the raw
    // coverage records feed scripts/merge-ct-coverage.mjs. The HTML and JUnit reports are then written by the merge.
    reporter: [
        ['list'],
        ...(process.env.CI
            ? [['blob'] as const]
            : [
                  ['html', { outputFolder: 'playwright-report', open: 'never' }] as const,
                  ['junit', { outputFile: 'playwright-report/junit.xml' }] as const,
              ]),
        [
            'monocart-reporter',
            {
                name: 'CT Report',
                outputFile: './monocart-report/index.html',
                sourcePath: ctCoverageOptions.sourcePath,
                coverage: ctCoverageOptions,
            },
        ],
    ],
});
