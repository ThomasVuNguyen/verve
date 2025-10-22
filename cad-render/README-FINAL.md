# OpenSCAD Browser Renderer - WORKING VERSION

## What This Is

A web-based OpenSCAD renderer using the **native OpenSCAD engine** compiled to WebAssembly. Perfect for integrating OpenSCAD rendering into your LLM-powered applications!

## Setup

```bash
# Already installed:
npm install openscad-wasm-prebuilt

# Start the server
npm start
```

## Usage

Open your browser to: **http://localhost:3000/index-working.html**

### Features

- ✅ **Native OpenSCAD** - Full language support (modules, functions, loops, etc.)
- ✅ **11MB WASM** - First load caches in browser
- ✅ **Free to Deploy** - Static files, no server-side rendering needed
- ✅ **STL Export** - Download rendered models
- ✅ **Auto-render** - Live preview as you type
- ✅ **Example Library** - Quick-start templates

### Programmatic Usage

To integrate into your app where an LLM generates OpenSCAD code:

```javascript
import OpenSCAD from './node_modules/openscad-wasm-prebuilt/dist/openscad.js';

// Initialize once
const openscad = await OpenSCAD({
    noInitialRun: true,
    print: console.log,
    printErr: console.error
});

// Render LLM-generated code
function renderCode(scadCode) {
    openscad.FS.writeFile('/input.scad', scadCode);
    openscad.callMain([
        '/input.scad',
        '--enable=manifold',
        '--export-format=binstl',
        '-o', '/output.stl'
    ]);

    const stl = openscad.FS.readFile('/output.stl');
    return stl; // Binary STL data
}

// Use in your LLM workflow
const llmGeneratedCode = `
    module box(w, d, h) {
        cube([w, d, h]);
    }
    box(10, 20, 30);
`;

const stlData = renderCode(llmGeneratedCode);
// Display in 3D viewer or download
```

## Deployment

### Static Hosting (Free)

Deploy to:
- **Vercel** - `vercel deploy`
- **Netlify** - `netlify deploy`
- **GitHub Pages** - Push to gh-pages branch
- **Cloudflare Pages** - Connect repo

Just upload all files - it's 100% client-side!

### CDN Optimization

The 11MB WASM file is loaded once and cached. For production:

1. Enable gzip/brotli compression
2. Set long cache headers for `/node_modules/openscad-wasm-prebuilt/dist/*`
3. Use a CDN for static assets

## API Reference

### OpenSCAD WASM Instance

```javascript
interface OpenSCAD {
    // Execute OpenSCAD CLI
    callMain(args: string[]): number;

    // Virtual filesystem
    FS: {
        writeFile(path: string, data: string | Uint8Array): void;
        readFile(path: string): Uint8Array;
        mkdir(path: string): void;
        unlink(path: string): void;
    }
}
```

### Common Commands

```javascript
// Render to STL
callMain(['/input.scad', '-o', 'output.stl'])

// Use manifold engine (better CSG)
callMain(['/input.scad', '--enable=manifold', '-o', 'output.stl'])

// Export as binary STL
callMain(['/input.scad', '--export-format=binstl', '-o', 'output.stl'])
```

## File Structure

```
├── index-working.html       # Main HTML file
├── app-working.js          # Application logic
├── styles.css              # UI styling
├── server.js               # Dev server
└── node_modules/
    └── openscad-wasm-prebuilt/
        └── dist/
            └── openscad.js  # 11MB - Native OpenSCAD WASM
```

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires WebAssembly and ES6 module support.

## Cost

- **Hosting**: $0 (static hosting free tier)
- **Bandwidth**: First 100GB/month free on most CDNs
- **Compute**: $0 (runs in user's browser)

Perfect for indie projects and LLM apps!

## License

GPL-2.0-or-later (from OpenSCAD)
