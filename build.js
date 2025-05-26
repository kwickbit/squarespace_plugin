const esbuild = require('esbuild');
const fs = require('fs');

const css = fs.readFileSync('./src/index.css', 'utf8');


esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    minify: true,
    outfile: 'dist/index.min.js',
    format: 'iife',
    target: 'es2015',
    globalName: 'initKwickBit',
    define: {
        'process.env.NODE_ENV': '"production"',
        'process.env.NUXT_PUBLIC_BACKEND_API_URL': JSON.stringify(process.env.NUXT_PUBLIC_BACKEND_API_URL || ''),
    },
    plugins: [
        {
            name: 'inline-css',
            setup(build) {
                build.onLoad({ filter: /\.css$/ }, () => ({
                    contents: `export default ${JSON.stringify(css)};`,
                    loader: 'js',
                }));
            },
        },
    ],
}).catch(() => process.exit(1));