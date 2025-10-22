# OpenSCAD Browser Renderer

A web-based **native OpenSCAD** renderer that runs entirely in your browser using WebAssembly. Write real OpenSCAD code with full language support and see your 3D models rendered in real-time.

## Features

- **Native OpenSCAD Engine** - Real OpenSCAD compiled to WebAssembly (not a clone!)
- **Full Language Support** - Modules, functions, loops, conditionals, everything!
- **Live Code Editor** - Monaco Editor with syntax highlighting
- **Real-time 3D Rendering** - Instant visualization using Three.js
- **Auto-render Mode** - Automatic updates as you type
- **Interactive 3D View** - Rotate, pan, and zoom with OrbitControls
- **STL Export** - Export your models to binary STL format
- **Example Library** - Quick-start templates included
- **Keyboard Shortcuts** - Ctrl+Enter to render
- **Manifold Engine** - Uses OpenSCAD's manifold engine for robust CSG operations

## Getting Started

Simply open `index.html` in a modern web browser. No build process or dependencies required!

The OpenSCAD WebAssembly engine will load automatically (first load may take a few seconds).

### Usage

1. Write OpenSCAD code in the left editor panel
2. Click "Render" or press Ctrl+Enter to visualize
3. Use your mouse to interact with the 3D view:
   - **Left click + drag**: Rotate
   - **Right click + drag**: Pan
   - **Scroll wheel**: Zoom
4. Toggle "Auto-render" for live updates as you type

## Supported OpenSCAD Features

This uses the **actual OpenSCAD engine**, so it supports the full OpenSCAD language:

### Primitives
- `cube([x, y, z], center=true/false)`
- `sphere(r=radius, $fn=segments)`
- `cylinder(h=height, r=radius, r1=bottom, r2=top, center=true/false, $fn=segments)`
- `polyhedron(points, faces)`
- `polygon(points)`
- And more!

### Transformations
- `translate([x, y, z])`
- `rotate([x, y, z])` or `rotate(a, [x, y, z])`
- `scale([x, y, z])`
- `mirror([x, y, z])`
- `multmatrix(m)`
- `color([r, g, b, a])`

### Boolean Operations
- `union()`
- `difference()`
- `intersection()`
- `hull()`
- `minkowski()`

### Language Features
- **Modules** - Define reusable components
- **Functions** - Custom calculations
- **Variables** - Store and reuse values
- **For loops** - Iterate and create patterns
- **Conditionals** - if/else logic
- **List comprehensions** - Advanced array operations
- **Include/Use** - Import libraries (limited in browser)

## Example Code

### Simple Module
```openscad
module box(width, depth, height) {
    cube([width, depth, height]);
}

box(10, 20, 30);

translate([40, 0, 0])
    sphere(r=15, $fn=50);
```

### Complex CSG
```openscad
difference() {
    union() {
        cube([40, 40, 40], center=true);
        translate([0, 0, 25])
            sphere(r=15, $fn=50);
    }
    cylinder(h=50, r=8, center=true, $fn=50);
    rotate([90, 0, 0])
        cylinder(h=50, r=8, center=true, $fn=50);
    rotate([0, 90, 0])
        cylinder(h=50, r=8, center=true, $fn=50);
}
```

### Parametric Design with Loops
```openscad
module gear_tooth(height) {
    linear_extrude(height=height)
        polygon([[0,0], [4,1], [4,-1]]);
}

for (i = [0:11]) {
    rotate([0, 0, i*30])
        translate([20, 0, 0])
            gear_tooth(5);
}
```

## Controls

- **Render (Ctrl+Enter)** - Process code and update 3D view
- **Export STL** - Download model as binary STL file
- **Reset View** - Return camera to default position
- **Auto-render** - Enable/disable automatic rendering (1s delay)
- **Load Example** - Quick-load example code

## Technical Details

Built with:
- **@openscad/openscad-wasm** - Official OpenSCAD WebAssembly build
- **Three.js** - 3D rendering engine with STLLoader
- **Monaco Editor** - VS Code's editor component
- **OrbitControls** - 3D navigation
- ES6 Modules - Modern JavaScript

### How It Works

1. OpenSCAD code is written to a virtual filesystem in the WASM instance
2. The native OpenSCAD engine processes it using the manifold CSG engine
3. Output is generated as binary STL format
4. Three.js STLLoader parses the STL and renders it as a 3D mesh
5. The model is automatically centered and fit to the viewport

## Browser Compatibility

Requires WebAssembly support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Modern browsers with ES6 module support required.

## Performance Notes

- First load downloads ~8MB WASM file (cached afterward)
- Complex models may take several seconds to render
- Auto-render has 1s debounce to prevent excessive rendering
- The manifold engine provides robust and fast CSG operations

## Limitations

- Cannot import external .scad files (no network access from WASM)
- Some OpenSCAD libraries may not be available
- 3D preview only (no 2D/animation modes)
- Console output limited to browser console

## Credits

- **OpenSCAD** - The amazing parametric CAD modeler
- **@openscad/openscad-wasm** - WebAssembly port by DSchroer
- **Three.js** - 3D graphics library
- **Monaco Editor** - Microsoft's code editor

## License

MIT License - Feel free to use and modify!
