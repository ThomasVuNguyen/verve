// Working OpenSCAD WASM Renderer using openscad-wasm-prebuilt
import OpenSCAD from './node_modules/openscad-wasm-prebuilt/dist/openscad.js';

class OpenSCADRenderer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentMesh = null;
        this.autoRender = false;
        this.renderTimeout = null;
        this.openscad = null;
        this.lastSTL = null;

        this.init();
    }

    async init() {
        const statusEl = document.getElementById('status');
        statusEl.className = 'status info';
        statusEl.textContent = 'Initializing 3D viewer...';

        this.initThreeJS();
        this.initEventListeners();

        try {
            statusEl.textContent = 'Loading OpenSCAD engine (11MB, may take a moment)...';

            this.openscad = await OpenSCAD({
                noInitialRun: true,
                print: (text) => console.log('[OpenSCAD]', text),
                printErr: (text) => console.error('[OpenSCAD Error]', text)
            });

            statusEl.className = 'status success';
            statusEl.textContent = 'Ready! OpenSCAD engine loaded. Click Render or press Ctrl+Enter.';
            console.log('OpenSCAD WASM initialized successfully!');

            // Enable render button
            document.getElementById('renderBtn').disabled = false;

        } catch (error) {
            statusEl.className = 'status error';
            statusEl.textContent = `Failed to load OpenSCAD: ${error.message}`;
            console.error('Initialization error:', error);
        }
    }

    initThreeJS() {
        const viewerContainer = document.getElementById('viewer');

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1e1e1e);

        this.camera = new THREE.PerspectiveCamera(
            45,
            viewerContainer.clientWidth / viewerContainer.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(100, 100, 100);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        viewerContainer.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-10, -10, -10);
        this.scene.add(directionalLight2);

        const gridHelper = new THREE.GridHelper(200, 20, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        const axesHelper = new THREE.AxesHelper(50);
        this.scene.add(axesHelper);

        window.addEventListener('resize', () => this.onWindowResize());
        this.animate();
    }

    initEventListeners() {
        const renderBtn = document.getElementById('renderBtn');
        renderBtn.disabled = true; // Disable until OpenSCAD loads

        renderBtn.addEventListener('click', () => this.render());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportSTL());
        document.getElementById('resetViewBtn').addEventListener('click', () => this.resetView());

        const autoToggle = document.getElementById('autoRenderToggle');
        autoToggle.addEventListener('change', (e) => {
            this.autoRender = e.target.checked;
        });

        const editor = document.getElementById('editor');
        editor.addEventListener('input', () => {
            if (this.autoRender && this.openscad) {
                clearTimeout(this.renderTimeout);
                this.renderTimeout = setTimeout(() => this.render(), 1000);
            }
        });

        document.getElementById('exampleSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadExample(e.target.value);
                e.target.value = '';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.render();
            }
        });
    }

    loadExample(example) {
        const examples = {
            module: `// Module Example
module box(width, depth, height) {
    cube([width, depth, height]);
}

box(10, 20, 30);

translate([40, 0, 0])
    sphere(r=15, $fn=50);`,

            csg: `// CSG Operations
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
}`,

            parametric: `// Parametric Gear
module gear_tooth(height) {
    linear_extrude(height=height)
        polygon([[0,0], [4,1], [4,-1]]);
}

teeth = 12;
radius = 20;

for (i = [0:teeth-1]) {
    rotate([0, 0, i * 360/teeth])
        translate([radius, 0, 0])
            gear_tooth(5);
}`
        };

        const editor = document.getElementById('editor');
        if (examples[example]) {
            editor.value = examples[example];
            if (this.autoRender && this.openscad) {
                this.render();
            }
        }
    }

    async render() {
        if (!this.openscad) {
            alert('OpenSCAD engine is still loading...');
            return;
        }

        const code = document.getElementById('editor').value;
        const statusEl = document.getElementById('status');

        try {
            statusEl.className = 'status info';
            statusEl.textContent = 'Rendering with native OpenSCAD...';

            // Write code to virtual filesystem
            this.openscad.FS.writeFile('/input.scad', code);

            // Render to STL
            const exitCode = this.openscad.callMain([
                '/input.scad',
                '--enable=manifold',
                '--export-format=binstl',
                '-o', '/output.stl'
            ]);

            if (exitCode !== 0) {
                throw new Error(`OpenSCAD failed with exit code ${exitCode}`);
            }

            // Read STL file
            const stlData = this.openscad.FS.readFile('/output.stl');
            this.lastSTL = stlData;

            // Load into Three.js
            this.loadSTL(stlData.buffer);

            statusEl.className = 'status success';
            statusEl.textContent = 'Rendered successfully with native OpenSCAD!';

        } catch (error) {
            statusEl.className = 'status error';
            statusEl.textContent = `Error: ${error.message}`;
            console.error('Render error:', error);
        }
    }

    loadSTL(stlArrayBuffer) {
        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
        }

        const loader = new THREE.STLLoader();
        const geometry = loader.parse(stlArrayBuffer);
        geometry.computeVertexNormals();

        const material = new THREE.MeshPhongMaterial({
            color: 0x4a90e2,
            shininess: 30
        });

        this.currentMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.currentMesh);

        // Update info
        const triangles = geometry.attributes.position.count / 3;
        document.getElementById('objectInfo').textContent = `Triangles: ${triangles.toLocaleString()}`;

        // Auto-fit camera
        const box = new THREE.Box3().setFromObject(this.currentMesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 2;

        this.camera.position.set(cameraZ, cameraZ, cameraZ);
        this.camera.lookAt(center);
        this.controls.target.copy(center);
        this.controls.update();
    }

    exportSTL() {
        if (!this.lastSTL) {
            alert('Please render a model first');
            return;
        }

        const blob = new Blob([this.lastSTL], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'model.stl';
        a.click();
        URL.revokeObjectURL(url);

        const statusEl = document.getElementById('status');
        statusEl.className = 'status success';
        statusEl.textContent = 'STL exported successfully!';
        setTimeout(() => {
            statusEl.className = 'status';
            statusEl.textContent = 'Ready';
        }, 2000);
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

// Initialize
new OpenSCADRenderer();
