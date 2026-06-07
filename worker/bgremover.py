import torch
from PIL import Image
from torchvision import transforms
from transformers import AutoModelForImageSegmentation
import os

# 1. Load the model from local directory (offline)
local_model_path = os.path.join(os.path.dirname(__file__), "ZhengPeng7_BiRefNet_lite")
device = "cuda" if torch.cuda.is_available() else "cpu"

model = AutoModelForImageSegmentation.from_pretrained(local_model_path, trust_remote_code=True)
model.to(device)
model.eval()

# 2. Prepare the Image
def process_image(image_path):
    input_image = Image.open(image_path).convert("RGB")
    
    # Standard BiRefNet normalization
    transform = transforms.Compose([
        transforms.Resize((1024, 1024)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    input_tensor = transform(input_image).unsqueeze(0).to(device)
    
    # Convert input to match model's dtype
    input_tensor = input_tensor.to(next(model.parameters()).dtype)
    
    # 3. Inference
    with torch.no_grad():
        preds = model(input_tensor)[-1].sigmoid().cpu()
        pred = preds[0].squeeze()
    
    # 4. Create Mask and Apply
    mask = transforms.ToPILImage()(pred)
    mask = mask.resize(input_image.size)
    
    input_image.putalpha(mask) # Adds transparency based on the mask
    return input_image
