import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/server/index.ts'],
        },
    },
    resolve: {
        alias: {
            '@core': resolve(__dirname, './src/core'),
            '@data': resolve(__dirname, './src/data'),
            '@server': resolve(__dirname, './src/server'),
        },
    },
});
