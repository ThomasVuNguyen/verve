// Simple wrapper for OpenSCAD WASM rendering

export async function renderOpenSCAD(scadCode) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./openscad-worker.js');

        worker.onmessage = (e) => {
            if (e.data.type === 'render') {
                if (e.data.status === 'success') {
                    resolve(e.data.output);
                    worker.terminate();
                } else {
                    reject(new Error(e.data.message || 'Rendering failed'));
                    worker.terminate();
                }
            } else if (e.data.type === 'log') {
                console.log('[OpenSCAD]', e.data.message);
            } else if (e.data.type === 'error') {
                console.error('[OpenSCAD Error]', e.data.message);
            }
        };

        worker.onerror = (error) => {
            reject(new Error(`Worker error: ${error.message}`));
            worker.terminate();
        };

        // Send render request
        worker.postMessage({
            type: 'render',
            scad: scadCode,
            format: 'stl'
        });

        // Timeout after 30 seconds
        setTimeout(() => {
            worker.terminate();
            reject(new Error('Rendering timeout (30s)'));
        }, 30000);
    });
}
