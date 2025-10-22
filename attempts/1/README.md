# verve
An experiment to run Language Model locally on the web

# Methodology
Using WebGPU & WebLLM

# How it works (under the hood)

Download model file
Start chatting

# Model Format

WebLLM uses **MLC (Machine Learning Compilation) format**, not GGUF.

MLC models are:
- Pre-compiled and optimized specifically for WebGPU
- Converted from original model formats using Apache TVM
- Split into multiple files (weights + compiled WASM library)
- Hosted on HuggingFace under the `mlc-ai` organization

You cannot use GGUF files directly with WebLLM. Pre-built MLC models are available at: https://huggingface.co/mlc-ai

# Philosophy

Minimal & readable code. This is not a scalable venture-scale business, but a creative expression in code