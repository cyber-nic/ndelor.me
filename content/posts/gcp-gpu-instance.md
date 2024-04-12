---
title: "GCP Instance with NVIDIA Tesla T4"
date: 2024-01-12T09:11:12Z
draft: false
---

# Context

Many interesting projects now require a modern GPU (or M1, but I'm not desperate enough to downgrade from Linux to OSX). Below are notes on how to spin up a VM instance with GPU in GCP and run a basic PyTorch workload. I chose [Watermark-Removal-Pytorch](https://github.com/braindotai/Watermark-Removal-Pytorch).

# Cost/Performance

After studying the available [GPU configurations](https://cloud.google.com/compute/docs/gpus) as well as [VM instance pricing][https://cloud.google.com/compute/vm-instance-pricing] I determined that the most affordable Accelerator optimized configuration (~$250/month) is the `N1 + nvidia-tesla-t4` (I operated in the europe-west1 region). This was plenty computing-power for my modest needs. This exercice set me back $0.83 USD.

# Terraform

Here are the `broad strokes`:

```terraform {}
resource "google_service_account" "default" {
  account_id   = "gpu-sa"
  display_name = "Custom SA for VM Instance"
}

resource "google_compute_disk" "default" {
  name = "disk-data"
  type = "pd-standard"
  zone = "europe-west1-b"
  size = "25"
}

# https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_instance
resource "google_compute_instance" "default" {
  name         = "gpu"
  machine_type = "n1-standard-1"
  zone         = "europe-west1-b"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
    }
  }

  attached_disk {
    source      = google_compute_disk.default.id
    device_name = google_compute_disk.default.name
  }

  network_interface {
    network = "default"
    access_config {
      network_tier = "STANDARD"
      // Ephemeral IP
    }
  }

  guest_accelerator {
    type = "nvidia-tesla-t4"
    count = 1
  }

  scheduling {
    on_host_maintenance = "TERMINATE"
    automatic_restart   = true
  }

  service_account {
    # Google recommends custom service accounts that have cloud-platform scope and permissions granted via IAM Roles.
    email  = google_service_account.default.email
    scopes = ["cloud-platform"]
  }

  metadata = {
    # ssh-keys = "${var.gce_ssh_user}:${file(var.gce_ssh_pub_key_file)}"
    # startup-script-url = "gs://<bucket>/path/to/file"
    startup-script = <<-EOF
  sudo apt -y install tmux git curl vim python3-full python3-distutils python3-pip

  # possibly require open ssl libs
  sudo apt install zlib1g zlib1g-dev libssl-dev libbz2-dev libsqlite3-dev

  # pyenv to install other python versions
  curl https://pyenv.run | bash

  # add pyenv instructions to .bashrc

  # install GPU drivers
  sudo apt install -y linux-headers-$(uname -r) build-essential software-properties-common pciutils gcc make dkms
  # follow instuctions: https://cloud.google.com/compute/docs/gpus/install-drivers-gpu

  EOF
  }
}
```

## Notes

1. GCP suggests using existing `Deep Learning VM images` that `have NVIDIA drivers pre-installed, and also include other machine learning applications such as TensorFlow and PyTorch`. This seems like a wise choice (next time!).
1. The `attached_disk` will be necessary as soon as you start installing dependencies to run any workload.
1. I recommend loading the start-up script from a url (as commented out), but left things inline for this article.
1. The start-up script `does not work` as-is. These are just notes.

```bash {}
export z=europe-west1-b
gcloud compute ssh --project=foo --zone=$z my_user@instance-1
gcloud compute scp --project=foo --zone=$z \
  --recurse some_data/ my_user@instance-1:/home/my_user
```

# Mount Disk

Installing all the apt deps, gpu drivers and python deps (eg. PyTorch) requires a certain amount of disk space. Mount a reasonably sized disk to accomodate your needs. See [GCP instructions](https://cloud.google.com/tpu/docs/setup-persistent-disk)

Obvioulsy lazy and just trying to deliver, my disk was mounted at `/home/my_user/.cache/` which is where pip deps are located. Unfortunately pip kept failing because of disk space until it was instructed to also use `/home/my_user/.cache/tmp/`.

# ImageMagick & Watermark-Removal-Pytorch

Watermark-Removal-Pytorch is a neat little project. Unfortunately it doesn't quite deliver when removing a watermark from a page of text. Nevertheless, here are notes on setting up the environment. ImageMagick was used to auto-crop a very large watermak image to the same dimensions as a watermark'ed image.

```bash {}
  # install imagemagick
  sudo apt -y install libpng-dev libjpeg-dev libtiff-dev imagemagick

  # deps identified by repeatedly running:
  #   python3 get-pip.py and
  #  `pip install -r requirements.txt`
  sudo apt -y install sox ffmpeg \
    libcairo2 libcairo2-dev libcairo2-dev \
    pkg-config python3-dev \
    libgirepository1.0-dev

  # install some other python version
  pyenv install 3.6
  pyenv local 3.6

  # clone repo
  git clone https://github.com/braindotai/Watermark-Removal-Pytorch

  # mounted disk hack
  # TMPDIR=/home/my_user/.cache/tmp/ pip install -r requirements.txt
  pip install -r requirements.txt
```

# Remove Watermark

I'll eventually write about the actual watermark removal result, but for now, here's the process:

```bash {}
# first copy foo.jpg and watermark.png over from local using scp cmd provided earlier
f=foo.jpg; convert ../watermark.png -gravity SouthWest -crop $(identify -format "%wx%h\n" $f)+0+0 "${f%.jpg}\_mask.png"

python3 inference.py --image-path ../foo.jpg --mask-path ../foo_mask.png
time python3 inference.py \
  --image-path ../foo.jpg \
  --mask-path ../mask.jpg \
  --max-dim 2048 \ # default is 512 which otherwise results in a smaller image
  --training-steps 2000

# completd 20 training steps in 11s
Completed: 100%|██████████████████████████████████████| 20/20 [00:08<00:00, 2.37it/s, Loss=0.00155]
real 0m11.974s

# completed 200 training steps in 90s
Completed: 100%|███████████████████████████████████| 200/200 [01:24<00:00, 2.36it/s, Loss=0.000156]
real 1m28.352s

# completd 2000 training steps in 14m
Completed: 100%|██████████████████████████████████| 2000/2000 [14:13<00:00, 2.34it/s, Loss=4.85e-6]
real 14m16.682s
```
