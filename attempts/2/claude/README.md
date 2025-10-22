# Local AI Chat Application

A simple web application that runs AI models locally in your browser. No server required, no API keys needed - everything runs natively in your browser using WebLLM.

## Features

- Runs completely in your browser (no backend server needed)
- Private and secure - all data stays on your device
- Beautiful, modern chat interface
- Uses Llama 3.2 1B model for fast responses
- Works across different devices

## How to Use

1. Open `index.html` in a modern web browser (Chrome, Edge, or Firefox recommended)
2. Wait for the AI model to download and initialize (first load may take a few minutes)
3. Start chatting once you see "AI ready" status
4. All processing happens locally - no internet connection needed after initial model download

## Requirements

- Modern web browser with WebGPU support (Chrome 113+, Edge 113+, or Firefox 115+)
- At least 4GB of RAM
- Internet connection for initial model download
- The model will be cached locally after first download

## Technical Details

- Uses @mlc-ai/web-llm for running AI models in the browser
- Llama 3.2 1B model (quantized for efficiency)
- Pure HTML/CSS/JavaScript - no build tools required
- Responsive design that works on desktop and mobile

## Troubleshooting

If the model fails to load:
- Make sure you're using a supported browser with WebGPU
- Check that you have a stable internet connection for the initial download
- Try refreshing the page
- Clear browser cache and try again

## Privacy

All conversations happen locally in your browser. No data is sent to any server. The AI model runs entirely on your device.
