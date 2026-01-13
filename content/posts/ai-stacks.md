---
title: "AI Stacks"
date: 2026-01-13T05:39:01Z
tags: ["ai"]
draft: false
---

## Overview

We often choose a specific model to solve a specific problem. Once that model is located, and without wanting to perform any conversion, we're at the mercy of its current format which might dictate the stack. Stacks aren't created equal: some focus on ease of use and portability, while others are all about performance and cost. Complexity matters in a world where speed is kind.

## A Concrete Example: Fara-7B

Fara-7B is Microsoft's first production-grade small language model (SLM) designed specifically for computer use. With only 7 billion parameters, Fara-7B is an ultra-compact Computer Use Agent (CUA) that achieves state-of-the-art performance within its size class and is competitive with larger, more resource-intensive agentic systems.

We'll use Fara-7B as a running example to discuss how formats, runtimes, and stacks show up in practice. There are four relevant sources:

- **Code repository**: training/inference code, scripts, configs; uses vLLM for serving — [microsoft/fara](https://github.com/microsoft/fara)
- **Base weights**: PyTorch `safetensors` shards + config + tokenizer — [microsoft/Fara-7B](https://huggingface.com/microsoft/Fara-7B)
- **GGUF**: Quantized GGUF files for llama.cpp and similar runtimes — [gguf-org/fara-7b-gguf](https://huggingface.com/gguf-org/fara-7b-gguf)
- **ONNX**: Exported ONNX model for ONNX Runtime and TensorRT conversion — [microsoft/Fara-7B-onnx](https://huggingface.com/microsoft/Fara-7B-onnx)

Other artifacts you may need (and where they show up):

- **Tokenizer files**: `tokenizer.json`, `vocab.json`, `merges.txt`, `special_tokens_map.json`, `added_tokens.json` define how text becomes tokens and must match the weights.
- **Model + generation config**: `config.json`, `generation_config.json` declare architecture, sizes, and default decoding settings.
- **Chat template**: `chat_template.jinja` standardizes system/user/assistant formatting for chat models.
- **Multimodal projector**: `mmproj-*.gguf` contains the vision-to-language adapter required for image inputs.
- **Preprocessors**: `preprocessor_config.json`, `video_preprocessor_config.json` specify image/video normalization and resizing steps.

## Model Formats (and why they matter)

Local inference lives or dies on **model format** support, and formats are not standardized across the tooling landscape.

Why this choice matters more than it seems:

- **Performance** — formats and runtimes can differ by multiples on the same GPU
- **Portability** — cross-platform compatibility decides where the model can run
- **Security** — some formats (like pickle-based `.pt`) are unsafe from untrusted sources
- **Maintenance** — operator compatibility and versioning can break deployments
- **Cost** — efficient formats reduce compute and energy bills

One more distinction helps: **architecture vs weights/precision**. The architecture is the model’s structure (layers, shapes, attention blocks). The weights are the learned numbers, and precision is how those numbers are stored (FP16, BF16, INT8, Q4, etc.). Two files can share the same architecture yet behave differently because their weights or precision differ.

The most common formats today:

- **PyTorch (safetensors / .pt)** — Native for most open-source models; broadest availability; works with PyTorch, vLLM, TGI, DeepSpeed. `safetensors` avoids pickle-code execution risks.
- **GGUF / GGML** — Quantized, small, laptop-friendly; used by llama.cpp and tooling around it; great availability for popular LLMs.
- **ONNX** — Graph format intended to be universal; strong for vision/audio; LLM support improving; fewer ready-made LLM exports; good path for TensorRT conversion.
- **TensorRT engines** — Compiled binary engines optimized for NVIDIA GPUs; fastest throughput but not portable across GPU architectures; require conversion.
- **Others (MLC, Mojo, WebGPU, etc.)** — Emerging formats for specialized runtimes.

### Performance Realities (and why results vary)

Different runtimes can produce **wildly different memory footprints and load behavior** for the same model.

Example from testing:

> Fara-7B on a **16GB NVIDIA Geforce RTX 5060**
>
> - **vLLM**: fails to load due to VRAM exhaustion
> - **llama.cpp (GGUF)**: loads successfully at ~80% VRAM usage

This surprises until we understand three effects:

1. **Quantization changes the math**

   Quantization stores weights in fewer bits to trade some accuracy for memory and speed.

   - GGUF commonly uses Q2–Q8 schemes
   - vLLM historically assumed FP16/BF16; quant support now exists but conversions vary
   - FP16 is 2×–4× the footprint of modern 4–8bit quants

2. **Serving frameworks trade memory for throughput**

   - vLLM allocates KV cache and batching structures up front
   - Great for APIs, costly for desktops/laptops
   - llama.cpp optimizes for single-device, interactive chat

3. **Compiled/graph runtimes have precompute overhead**

   - TensorRT, ORT-TRT, DeepSpeed may need temporary buffers
   - These can push borderline GPUs over the edge

## Stack Categories (by use case)

If you want to run AI models locally on a CUDA GPU, you quickly hit a wall of names: Ollama, vLLM, ONNX, TensorRT, Triton, llama.cpp, and so on. With formats and constraints in mind, it helps to think in **categories** first, then pick a stack inside the category that matches your use case.

Formats are files. Runtimes are engines that execute those files. A stack can be understood as the combination of format + runtime + hardware that ends up working for your use case.

### 1. Core DL frameworks and kernel toolchains

The **foundations** that almost everything else is built on.

Use this if you’re doing **research, custom architectures, or deep performance tuning.**

- **PyTorch (with Flash-Attention / xFormers)**
- **Triton (compiler/DSL)**
- **CUDA (raw)**

### 2. General-purpose inference runtimes

Engines that load a **frozen model graph** (ONNX, etc.) and run it efficiently.

Use this if you want **one engine** to run **many model types** across projects.

- **ONNX Runtime (CUDA / TensorRT EP)**
- **TensorRT**
- **MLC-LLM (TVM)**
- **TVM (core)**
- **OpenVINO**

### 3. High-throughput LLM serving frameworks

Systems built for **high QPS** and **multi-user APIs**.

- **vLLM**
- **Hugging Face TGI**
- **NVIDIA TensorRT-LLM**
- **FasterTransformer**
- **DeepSpeed-Inference**
- **NVIDIA Triton Inference Server**

### 4. Click-and-run desktop apps

Tools that turn LLMs into simple apps.

- **Ollama**
- **Text Generation WebUI / Kobold**
- **llama.cpp (as GUIs/wrappers)**

### 5. Lightweight quantized LLM engines

Focused on quantized models for **small GPUs or CPUs**.

- **llama.cpp (GGUF)**
- **GGML/GGUF ecosystem**
- **KoboldCPP, others**

### 6. Browser / hybrid GPU runners

Runtimes using **WebGPU/WebNN** in-browser.

- **Web LLM / WebGPU runners**
- **WASM + WebGPU toolchains**

## The Trilemma: Format × Runtime × Hardware

Choosing a stack ends up being a three-way trade:

- **Format defines size + quant**
- **Runtime defines scheduling + serving overhead**
- **Hardware defines ceiling**

Rule of thumb:

- Consumer laptops push toward **quant + lightweight engines**
- Servers push toward **FP16/BF16 + batching engines**

## Looking Forward

By 2027 we should be able to **download a single `model.gguf` (or `.safetensors`), hand it to a runtime, and have the system automatically pick the best engine and kernel for the user’s device**—without any manual format conversions or vendor-specific tuning. That convergence is already visible in the tooling today; the next few years will tighten the standards, squeeze out more performance, and finally make LLM inference a truly “plug-and-play” experience.

I hope.

## Glossary of Key Terms

| Term                        | Quick Definition                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Engine**                  | A low‑level, optimized runtime that executes a compiled model on specific hardware and manages the inference loop, memory, and device kernels.    |
| **Format**                  | The file representation of a model’s architecture and weights (e.g., `.pt`, `safetensors`, ONNX, GGUF) that dictates compatibility and precision. |
| **Runtime**                 | Software that loads a format into an engine and exposes APIs for inference, such as `vLLM`, `llama.cpp`, `Ollama`, or `TensorRT‑LLM`.             |
| **Hardware**                | The physical device (GPU, CPU, accelerator) that runs the engine; VRAM, cores, and bandwidth limit viable format/runtime combinations.            |
| **KV Cache**                | Stored attention keys/values from prior tokens that enable efficient next‑token generation while heavily influencing memory usage.                |
| **Paged Attention**         | A KV cache layout that splits memory into pages so oversized models can swap portions between fast and slow memory.                               |
| **Quantization**            | The practice of storing weights/activations at reduced precision (e.g., int8, Q4) to cut memory and boost speed with minimal accuracy loss.       |
| **GGUF**                    | A “General GPU‑Friendly Unified Format” binary that packages weights, architecture, and quant metadata for direct loading by GGML runtimes.       |
| **GGML**                    | The lightweight tensor library underpinning `llama.cpp`; GGUF is the file format it reads for CPU/GPU‑friendly inference.                         |
| **safetensors**             | A secure tensor storage format without arbitrary Python code, commonly used for PyTorch models from untrusted sources.                            |
| **.pt/.pth**                | Native PyTorch files that may include executable Python objects, creating potential security risks when loading unknown models.                   |
| **ONNX**                    | The Open Neural Network Exchange intermediate format that enables cross‑framework portability across ONNX Runtime, TensorRT, PyTorch, and more.   |
| **TensorRT**                | NVIDIA’s compiler/engine that turns ONNX or PyTorch models into highly optimized GPU kernels for production inference.                            |
| **vLLM**                    | An open‑source high‑throughput LLM runtime using paged attention, smart batching, and optional TensorRT engines for GPU efficiency.               |
| **llama.cpp**               | A minimal C++ inference library for GGML/GGUF models that supports CPU execution with optional CUDA offload and many quantizations.               |
| **Ollama**                  | A desktop‑friendly platform bundling llama.cpp and other runtimes into a simple CLI/API for downloading, quantizing, and serving models locally.  |
| **Triton Inference Server** | NVIDIA’s multi‑model serving platform that hosts ONNX, TensorRT, PyTorch, or TensorFlow models with dynamic batching and observability.           |
| **WebGPU / WebNN**          | Browser APIs that let runtimes execute models via WebAssembly + WebGPU/WebNN for install‑free demos and privacy‑preserving inference.             |
| **Browser/Hybrid GPU**      | Workloads split between CPU and WebGPU/WebNN inside a browser, enabling modest LLMs to run without native installs.                               |
| **Throughput**              | Tokens processed per second, the key metric for multi‑user or batched inference workloads.                                                        |
| **Latency**                 | Time per response or token, critical for interactive chat and real‑time systems.                                                                  |
| **Batching**                | Combining multiple requests into one GPU launch to increase utilization; most runtimes expose batch size controls.                                |
| **Prompt**                  | The input text that conditions model generation.                                                                                                  |
| **Token**                   | A subword unit processed by the model; token counts dominate memory and runtime.                                                                  |
| **Tokenizer**               | The rules and vocabulary that split text into tokens; mismatches can break prompting or degrade quality.                                          |
| **Perplexity**              | A measurement of how well a model predicts samples; lower values mean better language modeling, while quantization can raise it slightly.         |
