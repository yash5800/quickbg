#!/usr/bin/env python3
import os
import re
from huggingface_hub import snapshot_download

models = [
    "briaai/RMBG-1.4",
    "ZhengPeng7/BiRefNet_lite",
    "ZhengPeng7/BiRefNet",
]

base_dir = "/home/yash/Documents/projects/testbgremover/public/models"
worker_requirements_path = "/home/yash/Documents/projects/quickbg/worker/requirements.txt"

def parse_requirements(req_file):
    reqs = {}
    with open(req_file, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            match = re.match(r"([a-zA-Z0-9_-]+)([<>=!~]+.*)?", line)
            if match:
                pkg = match.group(1).lower()
                reqs[pkg] = line
    return reqs

def merge_requirements(model_dir):
    req_file = os.path.join(model_dir, "requirements.txt")
    if not os.path.exists(req_file):
        print(f"  No requirements.txt found in {model_dir}")
        return

    print(f"  Found requirements.txt, merging...")
    model_reqs = parse_requirements(req_file)

    with open(worker_requirements_path, "r") as f:
        worker_reqs = parse_requirements(f)

    updated = False
    for pkg, req in model_reqs.items():
        if pkg not in worker_reqs:
            worker_reqs[pkg] = req
            print(f"  + Added: {req}")
            updated = True

    if updated:
        with open(worker_requirements_path, "w") as f:
            for req in worker_reqs.values():
                f.write(req + "\n")
        print(f"  ✓ Updated {worker_requirements_path}")
    else:
        print(f"  ✓ No new dependencies to add")

for model_name in models:
    print(f"\n{'='*50}")
    print(f"Downloading {model_name}...")
    print(f"{'='*50}")
    
    target_dir = os.path.join(base_dir, model_name.replace("/", "_"))
    
    try:
        snapshot_download(
            repo_id=model_name,
            local_dir=target_dir,
            local_dir_use_symlinks=False
        )
        print(f"✓ Downloaded to: {target_dir}")
        merge_requirements(target_dir)
    except Exception as e:
        print(f"✗ Error downloading {model_name}: {e}")

print(f"\n{'='*50}")
print("All downloads complete!")
print(f"{'='*50}")