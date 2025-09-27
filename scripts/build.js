import { build } from 'esbuild';

// Source code
await build({
    entryPoints: {
        index: 'src/index.ts',
    },
    entryNames: '[name]',
    outdir: 'dist',
    bundle: true,
    //logLevel: 'info',
    format: 'esm',
    sourcemap: true
});

// SW
await build({
    entryPoints: {
        index: 'src/sw.ts'
    },
    entryNames: '[name]',
    outfile: 'dist-sw/sw.js',
    bundle: true,
    //logLevel: 'info',
    format: 'esm',
    sourcemap: true
});
