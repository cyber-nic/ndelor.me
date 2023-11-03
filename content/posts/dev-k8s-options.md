---
title: "Dev K8s Options"
date: 2023-11-02T06:33:25+01:00
lastmod: 2023-11-02T06:33:25+01:00
tags: ["kubernetes", "kind", "minikube", "k3d"]
draft: false
---

[Minikube](https://minikube.sigs.k8s.io/docs/start/), [KinD](https://kind.sigs.k8s.io/) (Kubernetes in Docker), and [k3d](https://k3d.io/) (K3s in Docker) are all tools for running Kubernetes clusters locally, primarily for development purposes. My personal experience with all 3 has been very positive.

For the last couple of years I've been operating on Fedora linux and have been keeping up with the latest releases. Originally I used minikube, but switched over to k3d whe DNS issues prevented it from reaching docker hub. A few months back I switched over to KinD out of simple curiosity. All 3 options drain my laptop's battery, so there isn't a clear winner there.

Here are some key differences, pros, and cons of each:

### Minikube

**Key Features:**

- It creates a VM or a Docker container to run the Kubernetes cluster.
- It has various "addons" which are built-in to provide additional functionality, such as the dashboard.

**Pros:**

1. **Mature**: One of the earliest solutions for local Kubernetes development.
2. **Driver Choices**: It supports various virtualization backends (VirtualBox, HyperKit, KVM, etc.).
3. **Addons**: Integrated tools and services like the Kubernetes dashboard, monitoring, logging, and more.
4. **Flexibility**: It can simulate various Kubernetes features like node conditions.

**Cons:**

1. **Overhead**: VM-based solutions can be heavyweight.
2. **Complexity**: Can be a bit complicated for new users with various configuration options.

### KinD (Kubernetes in Docker)

**Key Features:**

- Uses Docker containers to create Kubernetes "nodes".
- Developed by Kubernetes Special Interest Groups (SIGs) for testing Kubernetes itself.

**Pros:**

1. **Lightweight**: Runs entirely within Docker, no VM overhead.
2. **Quick Setup**: Typically faster setup times than VM-based solutions.
3. **Multi-node Clusters**: Easy to create multi-node clusters.
4. **CI Friendly**: Designed for CI/CD environments and Kubernetes conformance tests.

**Cons:**

1. **Networking**: Docker-in-Docker can occasionally have networking hiccups.
2. **Storage**: Not designed for complex storage scenarios, which can be limiting if you want to test storage features or solutions.

### k3d (K3s in Docker)

**Key Features:**

- Uses Docker containers to run K3s, a lightweight Kubernetes distribution.
- Ideal for edge and IoT use cases.

**Pros:**

1. **Ultra Lightweight**: K3s is a minimal Kubernetes distribution.
2. **Fast Start**: Starts quickly, making it excellent for local development.
3. **Integrated Tooling**: K3s has integrated networking (Flannel), storage (Local-path-provisioner), and load balancing (Traefik) solutions.
4. **Great for Edge**: Designed for edge and IoT scenarios, so running it locally can mimic these environments well.

**Cons:**

1. **Limited Features**: Some of the advanced Kubernetes features are stripped out in K3s to keep it lean.
2. **Different Experience**: Because it's a minimal distribution, some behaviors might differ from a full-fledged Kubernetes.

### Conclusion:

The best tool often depends on the user's specific needs:

- **Minikube** might be suitable for those who want a more "full" Kubernetes experience, possibly closer to a production-like environment.
- **KinD** is great for users looking for a lightweight solution and those doing CI/CD with Kubernetes.
- **k3d** is best for those wanting an ultra-lightweight environment, or if you're specifically looking to work with or test the capabilities of K3s.

However, it's worth noting that the lines between these tools are blurring. For instance, Minikube now supports a Docker driver, which means it can also run without a VM, much like KinD and k3d.

As a final note, all 3 local Kubernetes options are great for development and work especially well with [tilt.dev](https://tilt.dev/). Tilt is a tool for local development with Kubernetes. It watches your files for edits, rebuilds your Docker images and restarts your pods automatically. It's a great tool for local development and I highly recommend it.

\*\* this article was written with AI assistance
