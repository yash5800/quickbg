#!/usr/bin/env python3
import os
from huggingface_hub import snapshot_download

models = [
    "briaai/RMBG-1.4",
    "ZhengPeng7/BiRefNet_lite",
    "ZhengPeng7/BiRefNet",
]

base_dir = "/home/yash/Documents/projects/bgremover/public/models"

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
    except Exception as e:
        print(f"✗ Error downloading {model_name}: {e}")

print(f"\n{'='*50}")
print("All downloads complete!")
print(f"{'='*50}")