import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6';

env.allowLocalModels = false;
env.useBrowserCache = true;

let segmenterPromise;

async function getSegmenter() {
    if (!segmenterPromise) {
        segmenterPromise = pipeline('image-segmentation', 'briaai/RMBG-1.4');
    }

    return segmenterPromise;
}

async function removeBackground(imageElement) {
    // 1. Create the segmentation pipeline
    const segmenter = await getSegmenter();

    // 2. Run the model on your image
    const output = await segmenter(imageElement.src);

    // 3. The output contains a mask. You apply this to a canvas 
    // to make the background transparent.
    const firstOutput = Array.isArray(output) ? output[0] : output;
    const maskSource = firstOutput?.mask ?? firstOutput;

    if (!maskSource?.data || !maskSource?.width || !maskSource?.height) {
        throw new Error('Mask data not available in model output.');
    }

    const imageBlob = await fetch(imageElement.src).then((response) => response.blob());
    const original = await createImageBitmap(imageBlob);

    const canvas = document.createElement('canvas');
    canvas.width = original.width;
    canvas.height = original.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get canvas context.');
    }

    ctx.drawImage(original, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const rgba = imageData.data;

    const maskData = maskSource.data;
    const maskWidth = maskSource.width;
    const maskHeight = maskSource.height;
    const maskChannels = Math.max(1, Math.round(maskData.length / (maskWidth * maskHeight)));

    for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
            const pixelIndex = (y * canvas.width + x) * 4;
            const maskX = Math.min(maskWidth - 1, Math.floor((x / canvas.width) * maskWidth));
            const maskY = Math.min(maskHeight - 1, Math.floor((y / canvas.height) * maskHeight));
            const maskIndex = (maskY * maskWidth + maskX) * maskChannels;

            const rawMaskValue = maskData[maskIndex] ?? 0;
            const alpha = rawMaskValue <= 1 ? Math.round(rawMaskValue * 255) : Math.round(rawMaskValue);
            rgba[pixelIndex + 3] = alpha;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    imageElement.src = canvas.toDataURL('image/png');

    console.log("Background removed!", output);
}

const fileInput = document.getElementById('fileInput');
const previewImage = document.getElementById('previewImage');
const removeBtn = document.getElementById('removeBtn');
const statusText = document.getElementById('status');

if (fileInput && previewImage && removeBtn && statusText) {
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        previewImage.src = URL.createObjectURL(file);
        statusText.textContent = 'Image loaded. Ready to remove background.';
    });

    removeBtn.addEventListener('click', async () => {
        if (!previewImage.src) {
            statusText.textContent = 'Please choose an image first.';
            return;
        }

        try {
            statusText.textContent = 'Processing... (first run may take a while to load model)';
            await removeBackground(previewImage);
            statusText.textContent = 'Done. Background removed.';
        } catch (error) {
            console.error(error);
            statusText.textContent = `Failed: ${error?.message ?? 'See console for details.'}`;
        }
    });
}