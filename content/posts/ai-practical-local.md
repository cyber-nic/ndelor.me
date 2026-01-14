---
title: "Practical Local AI"
date: 2026-01-14T07:46:24Z
tags: ["ai", "nvidia", "cuda"]
draft: false
---

# Running Fara-7B Locally: Hardware, CUDA, VRAM, and Lessons Learned in 2026

## Why This Exists

I wanted to run **Fara-7B**, a computer-use + vision + long-context model, **locally**. The motivation was simple: experiment with agentic models without depending on cloud GPUs or paid APIs, and understand what “local computer use” currently requires in 2026.

## Model Selection & Expectations

Fara-7B looks small on paper (“7B”), but two features make it materially heavier:

1. **Vision** (screenshots + multimodal)
2. **Long context** (128k tokens advertised)

Both increase VRAM needs. Vision models tend to be closer to “chat + encoder” stacks than pure decoders. Long context implies larger KV caches and higher activation footprints.

> **Lesson**: _don’t use parameter count alone as the sizing metric._

## CUDA / Driver / Toolkit Triangle

A useful mental model:

```
                      +------------------+
                      |  NVIDIA Driver   |
                      +------------------+
                               |
                               v
                      +------------------+
                      |  CUDA Runtime    |
                      +------------------+
                               |
                               v
                      +------------------+
                      |  PyTorch Wheels  |
                      +------------------+
                               |
                               v
                      +------------------+
                      |  Model Runtimes  |
                      +------------------+
```

- Hardware

  - Example hardware referenced in this post: GTX 1070 8GB (Pascal, compute_cap:6.1 / sm_61) and the upgraded RTX 5060 16GB Ti (Blackwell, compute_cap:12.0).
  - Pascal compatibility caveat: Pascal-era cards may appear driver-compatible but lack modern SM features (tensor cores, newer instructions). Driver-level passthrough does not guarantee that recent CUDA/PyTorch/model runtimes will function correctly on Pascal devices.

- Driver

  - The kernel-level and user-space driver lets the operating system talk to the GPU hardware. It provides low-level libraries (libcuda, libnvidia-\*) that every CUDA app ultimately depends on. If the driver is missing or too old, higher layers cannot talk to the GPU at all.

- CUDA Runtime (CUDA Toolkit)

  - The user-space toolkit (headers, libcuda runtime, nvcc compiler, development libraries) that applications use to compile and run CUDA code. PyTorch and other frameworks are built against a particular CUDA runtime ABI. The runtime supplies libcudart and other libraries that PyTorch expects at runtime.

- PyTorch Wheels

  - A "wheel" is Python binary package format (a .whl file). A wheel contains compiled binaries so you don't have to build from source.
  - PyTorch wheels are prebuilt binary distributions compiled for a specific CUDA toolkit (for example, cu130 means CUDA 13.0). Installing the matching wheel gives you a PyTorch that knows how to call CUDA libraries without compiling them yourself. A mismatch can cause import errors or silent failures where CUDA calls are unavailable.

- Model Runtimes (vLLM, GGUF runtimes, etc.)
  - Runtimes are higher-level libraries and applications that load model weights, manage memory (activations, KV cache), provide quantized kernels, and implement generation logic. They depend on PyTorch (or other backends) to do GPU work. They also add their own expectations (e.g., certain torch APIs, specific CUDA kernels, or extensions) so they can fail if the PyTorch <-> CUDA link is mismatched.

> **Lesson**: _pick CUDA intentionally based on PyTorch availability, not the other way around._

### A note on _Pascal Compatibility CUDA Applications_

NVIDIA introduced a compatibility mode specifically for **Pascal (sm_61)** GPUs to allow some CUDA **drivers of newer major versions** to run **binaries compiled against older CUDA** toolkits. This is often surfaced as “Pascal Compatibility CUDA Applications” in discussion threads and driver release notes.

This matters because:

- Pascal-era GPUs (GTX 10-series) stopped receiving native support in certain CUDA toolchains.
- CUDA runtimes >11.x increasingly expect **Turing / Ampere / Ada** capabilities absent in Pascal.
- Passthrough compatibility is **not the same** as full support — many model runtimes and PyTorch wheels simply don’t ship builds targeting Pascal anymore.

In practical terms: **a GTX 1070 may appear compatible at the driver level but cannot run modern AI runtimes**, especially those expecting tensor cores, newer memory instructions, or SM >=70 scheduling. The “compatibility” layer mainly targets enterprise longevity, not modern ML workloads.

```bash
$ nvidia-smi --query-gpu=name,compute_cap --format=csv

name, compute_cap
NVIDIA GeForce RTX 5060 Ti, 12.0
```

- GTX 1070 → compute_cap = 6.1 → sm_61
- RTX 5060 → compute_cap = 12.0 → sm_120

## VRAM Budgeting & Fitting the Model

What consumes VRAM for LLM workloads:

- **Weights** (precision matters: fp16 vs q5 vs q4, etc.)
- **Activations**
- **KV cache**
- **Sequence length**
- **Batch size**

Fara-7B vision + long context wants more than a trivial 7B chat model.

Even with **16GB**, **vLLM OOM’ed**, partly due to KV allocation and runtime overhead. Quantization and GGUF runtimes helped reduce the footprint.

> **Lesson**: _VRAM is the bottleneck, not compute._

## Hardware Reality Check

The original attempt using the **GTX 1070 (sm_61, 8GB)** failed almost immediately with modern AI runtimes:

- Unsupported by new PyTorch wheels
- Unsupported by vLLM CUDA wheels
- Too little VRAM for 7B vision

Upgrading meant choosing between consumer tiers:

- “60-class” (xx60) → better value, sometimes AI-nerfed
- “70-class” (xx70) → better compute, more VRAM options
- “80-class” (xx80) → strong compute, more heat + power
- “90-class” (xx90) → expensive and overkill for experimentation

For LLM workloads, **VRAM beat FLOPs** as the limiting factor. I ended up with an **RTX 5060 Ti (16GB)**. 16GB turned out to be “just enough” for Fara-7B.

### Why the RTX 5060 failed on the B450M platform

A critical blocker surfaced when the RTX 5060 would not initialize on a B450M-class motherboard. The system powered on, fans spun, but there was no display output and no successful boot. BIOS updates, PCIe configuration changes, and power-related adjustments did not resolve the issue.

The root cause was not bandwidth — PCIe 3.0 ×16 is sufficient for modern GPUs — but firmware and platform expectations. Recent NVIDIA cards assume newer UEFI firmware behavior, updated PCIe link training, and features such as Resizable BAR. Many B450-era boards either lack these entirely or implement them inconsistently.

Once the platform was replaced with a newer B850M-class board, the GPU posted immediately, drivers loaded cleanly, and CUDA initialized without workarounds.

> **Lesson**: PCIe generations aren’t just bandwidth lines on a spec sheet. They carry firmware and platform assumptions forward. Modern GPUs push those assumptions harder than CPUs do. If you’re skipping multiple GPU generations, expect the motherboard to become the hidden limiter.

## Using the iGPU for Display to Free VRAM

This mattered more than expected. Running Xorg/GNOME on the NVIDIA GPU burned **~1.4GB VRAM idle**, which reduced available headroom for the model. Thankfully my motherboard has an integrated GPU (igpu) which both HDMI and Display port connectors.

Switching BIOS primary display → **iGPU (igfx)** freed almost all of that:

- BIOS: `Advanced → NB Configuration → Primary Video Device → igfx`
- Ubuntu: confirmed via
  `glxinfo | grep renderer` → AMD iGPU
  `nvidia-smi` → 15MiB idle

> **Lesson**: _local LLM = datacenter mentality: ideally, the GPU should not be rendering the desktop._

## Monitoring & Debugging Tooling

These tools made the process less blind:

- **`nvidia-smi`**: Processes + VRAM per process + sanity during loading/generation.
- **`nvtop`**: Real-time GPU + VRAM + utilization. (Ubuntu packaged version initially failed on 5060 → fallback to newer build.)
- **`gotop`**: Simple terminal system monitor. CPU/RAM trends while tinkering.
- **`btop`**: Temporary fallback when nvtop was missing/failed.
- **ChatGPT / Claude**: Debugging and explaining long python error stacks.

Basic workflow for debugging OOM:

```
start model → load phase → prefill → generate → compare peaks
```

Watching idle vs peak VRAM was the most informative metric.

## Cloud Alternatives (Sanity Check)

Before spending money on hardware, I compared against cloud GPUs:

- Hetzner: continues to charge until VM deleted ([link](https://docs.hetzner.com/cloud/billing/faq/?utm_source=chatgpt.com#do-you-bill-servers-that-are-off))
- Vultr: continues to charge while VM stopped ([link](https://docs.vultr.com/support/platform/billing/are-stopped-instances-still-billed-on-vultr?utm_source=chatgpt.com))
- AWS EC2: instance compute (incl GPU) not billed when stopped; storage/IPs still billed
- Google Cloud (example CGP): GPU not billed when stopped; storage/IPs still billed

Hourly pricing on A10/A100/4090 looks attractive, but usage patterns matter.
£500 buys a surprising amount of hours, but I preferred:

- Local latency
- No queueing
- No ongoing cost
- Learning

Note: billing models differ — some providers can continue to bill for attached resources (storage, reserved IPs, or GPU allocations) even when a VM is stopped or "powered off". This matters for hobby projects where unexpected charges can accumulate.

> **Lesson**: _cloud is great for benchmarking; local is great for iterative tinkering._

## The Python & Runtime Ecosystem Maze

Models today are more than just weights. Fara required:

- Model weights
- Runtime (GGUF/VLLM/etc.)
- Browser automation for CUA
- OpenAI-like API glue
- Python dependencies (PIL, openai, tenacity, etc.)

Most failures came from mismatches in:

- CUDA versions
- Wheels
- Device selection
- Memory fragmentation
- Missing Python deps

A separate note on Python: dependency management remains surprisingly fragile. Even with `venv` and modern tooling like `uv`, dependency resolution, binary wheels, platform-specific packages, and transitive breakage remain a drag. This matters because Python is the de facto language of the AI community; brittle environments slow experimentation and adoption. Of all the issues encountered, this is the area where improvement would have the highest payoff over the next few years.

> **Lesson**: _agentic models are full ecosystems, not single binaries._

## Final Lessons (Distilled)

- **VRAM is king**
- **CUDA compatibility cannot be improvised**
- **Pick GPU → pick CUDA → pick PyTorch → then install runtimes**
- **iGPU offload is a free ~1–2GB VRAM win**
- **Quantization makes the difference between “works” and “OOM”**
- **Vision + long context inflate model footprints dramatically**
- **Consumer GPUs remain viable, but everything assumes cloud-scale**
