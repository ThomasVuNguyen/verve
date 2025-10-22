// Native OpenSCAD WASM Renderer
import OpenSCAD from './openscad.js';

class OpenSCADRenderer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentMesh = null;
        this.editor = null;
        this.autoRender = false;
        this.renderTimeout = null;
        this.openscadInstance = null;
        this.isLoading = true;

        this.init();
    }

    async init() {
        // Show initial loading message
        const statusEl = document.getElementById('status');
        statusEl.className = 'status info';
        statusEl.textContent = 'Initializing...';

        this.initThreeJS();
        this.initEditor();
        this.initEventListeners();
        await this.initOpenSCAD();
        this.loadDefaultCode();
    }

    async initOpenSCAD() {
        const statusEl = document.getElementById('status');
        try {
            statusEl.className = 'status info';
            statusEl.textContent = 'Loading OpenSCAD engine...';

            this.openscadInstance = await OpenSCAD({
                noInitialRun: true,
                print: (text) => console.log('OpenSCAD:', text),
                printErr: (text) => console.error('OpenSCAD Error:', text)
            });

            this.isLoading = false;
            statusEl.className = 'status success';
            statusEl.textContent = 'OpenSCAD engine loaded successfully';

            console.log('OpenSCAD WASM initialized successfully');
        } catch (error) {
            this.isLoading = false;
            statusEl.className = 'status error';
            statusEl.textContent = `Failed to load OpenSCAD: ${error.message}`;
            console.error('Failed to initialize OpenSCAD WASM:', error);
        }
    }

    initThreeJS() {
        const viewerContainer = document.getElementById('viewer');

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1e1e1e);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            45,
            viewerContainer.clientWidth / viewerContainer.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(100, 100, 100);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        viewerContainer.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-10, -10, -10);
        this.scene.add(directionalLight2);

        // Grid
        const gridHelper = new THREE.GridHelper(200, 20, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        // Axes
        const axesHelper = new THREE.AxesHelper(50);
        this.scene.add(axesHelper);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Animation loop
        this.animate();
    }

    initEditor() {
        // Wait for monaco to be available
        const initMonaco = () => {
            if (typeof monaco === 'undefined') {
                setTimeout(initMonaco, 100);
                return;
            }

            this.editor = monaco.editor.create(document.getElementById('editor'), {
                value: '',
                language: 'javascript',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on'
            });

            // Auto-render on change
            this.editor.onDidChangeModelContent(() => {
                if (this.autoRender && !this.isLoading) {
                    clearTimeout(this.renderTimeout);
                    this.renderTimeout = setTimeout(() => this.render(), 1000);
                }
            });
        };

        initMonaco();
    }

    initEventListeners() {
        document.getElementById('renderBtn').addEventListener('click', () => this.render());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportSTL());
        document.getElementById('resetViewBtn').addEventListener('click', () => this.resetView());
        document.getElementById('autoRenderToggle').addEventListener('change', (e) => {
            this.autoRender = e.target.checked;
            if (this.autoRender && !this.isLoading) this.render();
        });
        document.getElementById('exampleSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadExample(e.target.value);
                e.target.value = '';
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.render();
            }
        });
    }

    loadDefaultCode() {
        const defaultCode = `// Native OpenSCAD Renderer
// Full OpenSCAD support including modules!

module box(width, depth, height) {
    cube([width, depth, height]);
}

box(10, 20, 30);

translate([40, 0, 0])
    sphere(15);

translate([-40, 0, 0])
    cylinder(30, 10, 10);
`;
        if (this.editor) {
            this.editor.setValue(defaultCode);
        } else {
            setTimeout(() => this.loadDefaultCode(), 100);
        }
    }

    loadExample(example) {
        const examples = {
            cube: `// Simple Cube
cube([30, 30, 30], center=true);`,

            sphere: `// Sphere Example
sphere(r=20, $fn=50);`,

            cylinder: `// Cylinder Examples
cylinder(h=30, r1=10, r2=10, $fn=50);

translate([30, 0, 0])
    cylinder(h=30, r1=10, r2=5, $fn=50);

translate([60, 0, 0])
    cylinder(h=30, r1=5, r2=10, $fn=50);`,

            complex: `// Complex CSG Operations
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
}`
        };

        if (examples[example] && this.editor) {
            this.editor.setValue(examples[example]);
            if (this.autoRender && !this.isLoading) this.render();
        }
    }

    async render() {
        if (this.isLoading || !this.openscadInstance) {
            const statusEl = document.getElementById('status');
            statusEl.className = 'status error';
            statusEl.textContent = 'OpenSCAD engine is still loading...';
            return;
        }

        const code = this.editor.getValue();
        const statusEl = document.getElementById('status');

        try {
            statusEl.className = 'status info';
            statusEl.textContent = 'Rendering with native OpenSCAD...';

            // Write the OpenSCAD code to the virtual filesystem
            this.openscadInstance.FS.writeFile('/input.scad', code);

            // Render to STL using native OpenSCAD
            // Using manifold engine for better CSG operations
            const exitCode = this.openscadInstance.callMain([
                '/input.scad',
                '--enable=manifold',
                '--export-format=binstl',
                '-o', '/output.stl'
            ]);

            if (exitCode !== 0) {
                throw new Error(`OpenSCAD rendering failed with exit code ${exitCode}`);
            }

            // Read the generated STL file
            const stlData = this.openscadInstance.FS.readFile('/output.stl');

            // Load the STL into Three.js
            this.loadSTL(stlData.buffer);

            statusEl.className = 'status success';
            statusEl.textContent = 'Rendered successfully with native OpenSCAD';

        } catch (error) {
            statusEl.className = 'status error';
            statusEl.textContent = `Error: ${error.message}`;
            console.error('Rendering error:', error);
        }
    }

    loadSTL(stlArrayBuffer) {
        // Remove previous mesh
        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
            this.currentMesh = null;
        }

        // Load STL
        const loader = new THREE.STLLoader();
        const geometry = loader.parse(stlArrayBuffer);

        // Center geometry
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);

        // Compute normals for proper lighting
        geometry.computeVertexNormals();

        // Create material
        const material = new THREE.MeshPhongMaterial({
            color: 0x4a90e2,
            shininess: 30,
            flatShading: false
        });

        // Create mesh
        this.currentMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.currentMesh);

        // Update info
        const objectInfo = document.getElementById('objectInfo');
        const triangleCount = geometry.attributes.position.count / 3;
        objectInfo.textContent = `Triangles: ${triangleCount.toLocaleString()}`;

        // Auto-fit camera to object
        this.fitCameraToObject(this.currentMesh);
    }

    fitCameraToObject(object) {
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

        cameraZ *= 2; // Add some margin

        this.camera.position.set(cameraZ, cameraZ, cameraZ);
        this.camera.lookAt(center);
        this.controls.target.copy(center);
        this.controls.update();
    }

    async exportSTL() {
        if (this.isLoading || !this.openscadInstance) {
            alert('OpenSCAD engine is still loading...');
            return;
        }

        const statusEl = document.getElementById('status');

        try {
            // Check if we have already rendered
            let stlData;
            try {
                stlData = this.openscadInstance.FS.readFile('/output.stl');
            } catch {
                // If no previous render, render now
                statusEl.className = 'status info';
                statusEl.textContent = 'Generating STL...';

                const code = this.editor.getValue();
                this.openscadInstance.FS.writeFile('/input.scad', code);

                const exitCode = this.openscadInstance.callMain([
                    '/input.scad',
                    '--enable=manifold',
                    '--export-format=binstl',
                    '-o', '/output.stl'
                ]);

                if (exitCode !== 0) {
                    throw new Error(`OpenSCAD rendering failed with exit code ${exitCode}`);
                }

                stlData = this.openscadInstance.FS.readFile('/output.stl');
            }

            // Download the STL file
            const blob = new Blob([stlData], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'model.stl';
            a.click();
            URL.revokeObjectURL(url);

            statusEl.className = 'status success';
            statusEl.textContent = 'STL exported successfully';

        } catch (error) {
            statusEl.className = 'status error';
            statusEl.textContent = `Export failed: ${error.message}`;
            console.error('Export error:', error);
        }
    }

    resetView() {
        this.camera.position.set(100, 100, 100);
        this.camera.lookAt(0, 0, 0);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    onWindowResize() {
        const viewerContainer = document.getElementById('viewer');
        this.camera.aspect = viewerContainer.clientWidth / viewerContainer.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new OpenSCADRenderer();
    });
} else {
    new OpenSCADRenderer();
}
