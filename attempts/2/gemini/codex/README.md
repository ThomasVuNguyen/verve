# Local AI Chat (WebLLM)

A lightweight web application that runs an AI model locally in your browser using WebGPU via WebLLM. No server required — just open the page and start chatting.

## Features

- Runs the AI model locally in-browser (WebGPU required)
- Simple chat UI with streaming responses
- Model selection (pick a small or larger model)
- Persist chat history in your browser (localStorage)
- Export/Import conversations as JSON

## Quick Start

Option 1: Open directly

1. Open `index.html` in a modern browser that supports WebGPU (Chrome, Edge). Safari/WebKit support varies.
2. Pick a model, wait for initialization/download, and start chatting.

Option 2: Serve locally

1. Use any static server (Python, Node, etc.). Examples:
   - Python: `python -m http.server 5173` then open http://localhost:5173
   - Node (if you have `http-server`): `npx http-server -p 5173` then open http://localhost:5173

## Notes

- The first model load downloads model artifacts and compiles shaders; this can take a few minutes depending on your GPU/CPU and model size. Subsequent loads are faster due to caching.
- If your device has limited VRAM, prefer the smallest model.
- Everything stays on your machine; no external inference service is used. The model artifacts are fetched from the WebLLM CDNs on first use.

## Troubleshooting

- If you see a message that WebGPU is unavailable, ensure your browser is up to date and hardware acceleration is enabled.
- If model initialization stalls, try a smaller model or reload the page.

