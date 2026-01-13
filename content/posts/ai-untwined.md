---
title: "AI Untwined"
date: 2025-02-12T06:55:09Z
tags: ["ai"]
draft: false
---

## **Operations**

There are several fundamental types of AI/ML operations, including:

1. **Embedding** – Converts input data into vector representations.
2. **Inference** – Applies a trained model to make predictions or classifications.
3. **Training** – Adjusts model parameters based on data to learn patterns.
4. **Fine-tuning** – Adapts a pre-trained model to a specific task.
5. **Preprocessing** – Cleans, normalizes, or structures raw data before use.
6. **Postprocessing** – Refines model outputs for final consumption.
7. **Retrieval** – Searches and fetches relevant information (e.g., RAG).
8. **Generation** – Produces new content (e.g., text, images, code).
9. **Optimization** – Refines a system or model for efficiency or accuracy.
10. **Distillation** – Transfers knowledge from a large model (teacher) to a smaller one (student) for efficiency.
11. **Quantization** – Reduces model precision (e.g., FP32 → INT8) for faster execution.

## **Model Variants & Flavors**

AI models differ based on architecture, use case, and efficiency:

- **Transformers** – Large, general-purpose (e.g., GPT, LLaMA, Mistral).
- **Sentence Transformers** – Optimized for embeddings (e.g., SBERT).
- **Diffusion Models** – Used for image generation (e.g., Stable Diffusion).
- **RNNs/LSTMs** – Sequential data modeling (less common now).
- **Small-scale Models** – Lighter models for edge devices (e.g., DistilBERT, Gemma).
- **On-Device ML** – TinyML, MobileNet, Whisper small versions.

## **Frameworks & Libraries**

- **PyTorch** (open-source) – Most flexible, widely used for research and deployment.
- **TensorFlow** (open-source) – Industry adoption, supports mobile (TensorFlow Lite).
- **JAX** (open-source) – Optimized for high-performance computing.
- **ONNX** (open-source) – Standard format for cross-framework model execution.
- **Jupyter Notebooks** -

## **Model Execution & Optimization**

- **ONNX Runtime** – Runs ONNX models efficiently on CPU/GPU.
- **TorchScript** – Converts PyTorch models to optimized bytecode.
- **TensorRT** (proprietary) – NVIDIA’s high-performance inference engine.
- **GGUF (GPT-based)** – Optimized quantized formats for local LLMs.

## **Platforms for Running Models Locally**

- **Hugging Face Transformers** (open-source) – Load/run pre-trained models easily.
- **Ollama** (open-source) – Simplifies running local LLMs.
- **LM Studio** (open-source) – GUI for running LLMs locally.
- **Whisper.cpp/Llama.cpp** (open-source) – Optimized for CPU-based execution.
- **FastText** (open-source) – Lightweight text classification/embedding.

## **The "Two Stages"**

Machine learning workflows typically consist of two major phases:

1. **Experimental Stage (Research & Prototyping)**

   - This is where models are built, tested, and refined.
   - Often involves:
     - **Trying different architectures** (CNNs, RNNs, Transformers, etc.).
     - **Hyperparameter tuning**.
     - **Working with datasets interactively**.
   - Traditionally done in Python using **PyTorch, TensorFlow, Jupyter Notebooks**, etc.
   - Optimized for **flexibility** rather than performance.

2. **Deployment Stage (Production)**
   - Once a model is finalized, it needs to be deployed for inference.
   - Requirements shift towards:
     - **Efficiency** (low latency, high throughput).
     - **Scalability** (runs efficiently on CPUs/GPUs in production).
   - Typically, models are "rewritten" in **C++ (mlpack, dlib)** or **optimized with TensorFlow Serving, ONNX Runtime, or TensorRT** for performance.

## **How Models Can Be "Rewritten"**

The term **"rewriting" a model** usually refers to optimizing or converting it from one framework to another for production use. This happens in several ways:

### **a. Manual Rewriting (Traditional)**

- Data scientists prototype models in **Python (PyTorch, TensorFlow)**.
- Engineers rewrite them in **C++, Rust, or optimized C libraries** for efficiency.
- Example:
  - A TensorFlow model trained in Python is rewritten using **C++ (dlib, mlpack)** for deployment.

### **b. Model Conversion (Modern Approach)**

- Instead of manually rewriting models, conversion tools allow them to be transformed:
  - **ONNX**: Converts models from PyTorch/TensorFlow to ONNX, which can run efficiently with **ONNX Runtime**.
  - **TorchScript**: Converts PyTorch models into deployable binaries.
  - **TensorRT**: Optimizes TensorFlow/PyTorch models for NVIDIA GPUs.
  - **GGUF** (Llama.cpp format): Optimizes LLMs for local execution.

# **Learning Plan: Mastering Embedding Deployment & Search in Go**

🔹 **Goal:** Develop **expertise in running, optimizing, and deploying various embedding models locally** using Go.  
🔹 **Scope:** Focus on **deployment, inference optimization, and retrieval**—**not model training**.

---

## **🟢 Step 1: API-Based Embeddings with Local Tokenization**

✅ **Goal:** Learn embedding fundamentals by using a 3rd-party API (e.g., **VoyageAI, OpenAI**) while **handling tokenization locally**.

🔹 **Key Concepts:**

- How **embeddings** work & what they represent.
- **Tokenization** (splitting text into subwords) to control request size.
- Making **efficient API calls** in Go.

🔹 **Tech Stack:**

- **Embedding API:** [VoyageAI](https://docs.voyageai.com/) or OpenAI
- **Tokenizer:** [`github.com/sugarme/tokenizer`](https://github.com/sugarme/tokenizer)

🔹 **Tasks:**

1. Install **sugarme/tokenizer** and test tokenization.
2. Make an API call to **VoyageAI/OpenAI** for embeddings.
3. **Store embeddings** in-memory or in a JSON file.
4. Compute **cosine similarity** manually for a simple search function.

✅ **Outcome:** Understand embeddings, API usage, and tokenization in Go.

---

## **🟡 Step 2: Replace API Calls with Local Ollama Model**

✅ **Goal:** **Run embeddings locally** using **Ollama**, removing external API dependencies.

🔹 **Key Concepts:**

- Running **Ollama models** on a local machine.
- Comparing **local inference speed vs. API latency**.
- **Vector storage** for search.

🔹 **Tech Stack:**

- **Embeddings:** [Ollama](https://ollama.ai/) (`ollama run mxbai-embed-large`)
- **Vector Database:** FAISS (`github.com/DataIntelligenceCrew/go-faiss`) or Qdrant (`qdrant-client-go`)

🔹 **Tasks:**

1. Install and **run Ollama embedding model** (`mxbai-embed-large`).
2. Generate **embeddings locally** in Go via the **Ollama API**.
3. Store embeddings in **FAISS or Qdrant** for fast retrieval.
4. Implement **similarity search (cosine distance, k-NN)**.

✅ **Outcome:** Hands-on experience with **local inference and vector DB integration**.

---

## **🟠 Step 3: Optimize Embedding Model Execution**

✅ **Goal:** **Experiment with different ways to optimize inference performance**.

🔹 **Key Concepts:**

- **Quantization** (reducing model size for speed).
- **Multi-threading for parallel inference**.
- **Benchmarking different models**.

🔹 **Tech Stack:**

- **Optimized Ollama models** (quantized `.gguf` versions).
- **Profiling tools** (`pprof`, Go Benchmarking).
- **Multi-threading** in Go.

🔹 **Tasks:**

1. Run **different Ollama models** (`nomic-embed-text`, `mxbai-embed-large`).
2. Compare speed & accuracy of **quantized vs. non-quantized models**.
3. Benchmark **batch inference** performance.
4. Experiment with **parallel embedding generation**.

✅ **Outcome:** Ability to **fine-tune performance settings for embedding models**.

---

## **🔴 Step 4: Use ONNX Runtime for Faster Local Inference**

✅ **Goal:** Run an **ONNX-optimized embedding model** using Go, bypassing Python overhead.

🔹 **Key Concepts:**

- **ONNX format** for running models across platforms.
- **Optimized inference on CPU/GPU**.
- Running ONNX models **without Python**.

🔹 **Tech Stack:**

- **ONNX Runtime:** [`github.com/yalue/onnxruntime_go`](https://github.com/yalue/onnxruntime_go).
- **ONNX Models:** Download from Hugging Face (`all-MiniLM-L6-v2.onnx`).

🔹 **Tasks:**

1. Install and **load an ONNX model in Go**.
2. Generate embeddings using **onnxruntime_go**.
3. Compare performance vs. **Ollama embeddings**.
4. Integrate ONNX-based embeddings into **FAISS or Qdrant**.

✅ **Outcome:** Expertise in running **optimized ONNX models** for embedding generation.

---

## **📈 Summary: Building a Go-Based Embedding Powerhouse**

| **Step** | **Focus**                           | **Tech Used**                             | **Outcome**                                              |
| -------- | ----------------------------------- | ----------------------------------------- | -------------------------------------------------------- |
| **1**    | API-based embeddings & tokenization | VoyageAI/OpenAI, `sugarme/tokenizer`      | Learn embeddings, tokenization, API integration          |
| **2**    | Local embedding inference           | Ollama, FAISS/Qdrant                      | Run embeddings locally, store vectors, implement search  |
| **3**    | Optimization & performance tuning   | Ollama, Quantized Models, Go Benchmarking | Reduce inference latency, experiment with model settings |
| **4**    | ONNX for high-performance inference | ONNX Runtime (`onnxruntime_go`)           | Deploy highly efficient embedding models locally         |

---

## **Enhancements & Optional Next Steps**

🚀 **Expand skills further with:**

- **Use embeddings in a real-world app** (e.g., a CLI for searching a Git repo).
- **Deploy as a web service** (Go + Gin/Fiber).
- **Experiment with different vector DBs** (Weaviate, Pinecone).
- **Explore quantization & model compression** further.

---

## **Final Thoughts**

✅ **This learning plan is focused on real-world skills**—deploying, running, and optimizing **embedding models** in Go.  
✅ **Enhancements allow deeper performance tuning**.  
✅ **No unnecessary detours into training models**—just practical embedding-based search.

Would you like **example code scaffolding** for any step? 🚀
