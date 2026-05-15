import sys
import os
import torch
from PIL import Image
from torchvision import transforms
from transformers import AutoModelForImageSegmentation

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(SCRIPT_DIR, "public", "models")

MODEL_PATHS = {
    "fast": os.path.join(MODELS_DIR, "ZhengPeng7_BiRefNet_lite"),
    "quality": os.path.join(MODELS_DIR, "ZhengPeng7_BiRefNet"),
    "best": os.path.join(MODELS_DIR, "briaai_RMBG-1.4"),
}

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}", file=sys.stderr)

models = {}

def ensure_model_exists(model_path, model_key):
    if not os.path.exists(model_path):
        print(f"Model not found at {model_path}, downloading from HuggingFace...", file=sys.stderr)
        model_name = {
            "fast": "ZhengPeng7/BiRefNet_lite",
            "quality": "ZhengPeng7/BiRefNet",
            "best": "briaai/RMBG-1.4",
        }.get(model_key, "ZhengPeng7/BiRefNet_lite")
        
        from huggingface_hub import snapshot_download
        snapshot_download(
            repo_id=model_name,
            local_dir=model_path,
            local_dir_use_symlinks=False
        )
        print(f"Model downloaded to {model_path}", file=sys.stderr)

def load_model(model_type):
    global models
    if model_type not in models:
        model_path = MODEL_PATHS.get(model_type, MODEL_PATHS["fast"])
        ensure_model_exists(model_path, model_type)
        
        print(f"Loading {model_type} model from: {model_path}...", file=sys.stderr)
        
        model = AutoModelForImageSegmentation.from_pretrained(
            model_path, 
            trust_remote_code=True,
            torch_dtype=torch.float32
        )
        model.to(device)
        model.eval()
        models[model_type] = model
        print(f"Model loaded successfully", file=sys.stderr)
    return models[model_type]

def process_image(image_path, model_type="fast"):
    global models
    print(f"Processing with model_type: {model_type}", file=sys.stderr)
    
    model = load_model(model_type)
    
    input_image = Image.open(image_path).convert("RGB")
    original_size = input_image.size
    
    print(f"Image size: {original_size}", file=sys.stderr)
    
    transform = transforms.Compose([
        transforms.Resize((1024, 1024)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    input_tensor = transform(input_image).unsqueeze(0).to(device)
    input_tensor = input_tensor.to(next(model.parameters()).dtype)
    
    print("Running inference...", file=sys.stderr)
    with torch.no_grad():
        preds = model(input_tensor)[-1].sigmoid().cpu()
        pred = preds[0].squeeze()
    
    print("Creating mask...", file=sys.stderr)
    mask = transforms.ToPILImage()(pred)
    mask = mask.resize(original_size)
    
    input_image.putalpha(mask)
    
    base_name = os.path.splitext(image_path)[0]
    output_path = f"{base_name}_no_bg.png"
    input_image.save(output_path)
    print(f"Saved output to: {output_path}", file=sys.stderr)
    return output_path

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python bgremove.py <image_path> [model_type]", file=sys.stderr)
        sys.exit(1)
    
    image_path = sys.argv[1]
    model_type = sys.argv[2] if len(sys.argv) > 2 else "fast"
    
    print(f"Starting processing - image: {image_path}, model: {model_type}", file=sys.stderr)
    
    try:
        output_path = process_image(image_path, model_type)
        print(f"SUCCESS:{output_path}", file=sys.stderr)
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)