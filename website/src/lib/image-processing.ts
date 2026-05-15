import sharp from "sharp";

export type ImageFormat = "png" | "jpeg" | "jpg" | "webp" | "avif" | "gif" | "tiff";

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  position?: "top" | "right" | "bottom" | "left" | "center";
}

export interface CompressOptions {
  quality?: number;
}

export interface FiltersOptions {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  grayscale?: boolean;
  blur?: number;
  sharpen?: number;
  gaussianBlur?: number;
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
}

export interface WatermarkOptions {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  opacity?: number;
  position?: "center" | "bottom-right" | "bottom-left" | "top-right" | "top-left";
  margin?: number;
}

export interface BorderOptions {
  width?: number;
  color?: string;
  radius?: number;
}

export async function resizeImage(
  inputBuffer: Buffer,
  options: ResizeOptions
): Promise<Buffer> {
  const { width, height, fit = "cover", position = "center" } = options;

  return sharp(inputBuffer)
    .resize(width, height, {
      fit,
      position,
    })
    .toBuffer();
}

export async function compressImage(
  inputBuffer: Buffer,
  format: ImageFormat,
  options: CompressOptions
): Promise<Buffer> {
  const { quality = 80 } = options;

  const pipeline = sharp(inputBuffer);

  switch (format) {
    case "jpeg":
    case "jpg":
      return pipeline.jpeg({ quality }).toBuffer();
    case "png":
      return pipeline.png({ quality }).toBuffer();
    case "webp":
      return pipeline.webp({ quality }).toBuffer();
    case "avif":
      return pipeline.avif({ quality }).toBuffer();
    case "gif":
      return pipeline.gif().toBuffer();
    case "tiff":
      return pipeline.tiff({ quality }).toBuffer();
    default:
      return pipeline.png().toBuffer();
  }
}

export async function applyFilters(
  inputBuffer: Buffer,
  options: FiltersOptions
): Promise<Buffer> {
  const {
    brightness = 1,
    contrast = 1,
    saturation = 1,
    grayscale = false,
    blur = 0,
    sharpen = 0,
    rotate = 0,
    flip = false,
    flop = false,
  } = options;

  let pipeline = sharp(inputBuffer);

  if (grayscale) {
    pipeline = pipeline.grayscale();
  }

  if (blur > 0) {
    pipeline = pipeline.blur(blur);
  }

  if (sharpen > 0) {
    pipeline = pipeline.sharpen(sharpen);
  }

  if (brightness !== 1 || contrast !== 1 || saturation !== 1) {
    pipeline = pipeline.modulate({
      brightness,
      saturation,
    });
    if (contrast !== 1) {
      pipeline = pipeline.linear(contrast, -(128 * (contrast - 1)));
    }
  }

  if (rotate !== 0) {
    pipeline = pipeline.rotate(rotate);
  }

  if (flip) {
    pipeline = pipeline.flip();
  }

  if (flop) {
    pipeline = pipeline.flop();
  }

  return pipeline.toBuffer();
}

export async function addWatermark(
  inputBuffer: Buffer,
  options: WatermarkOptions
): Promise<Buffer> {
  const {
    text,
    fontSize = 24,
    color = "white",
    opacity = 0.5,
    position = "bottom-right",
    margin = 20,
  } = options;

  const metadata = await sharp(inputBuffer).metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;

  const svgText = `
    <svg width="${width}" height="${height}">
      <style>
        .watermark {
          font-size: ${fontSize}px;
          font-family: Arial, sans-serif;
          fill: ${color};
          opacity: ${opacity};
        }
      </style>
      <text 
        x="${getXPosition(position, width, margin)}" 
        y="${getYPosition(position, height, margin, fontSize)}"
        class="watermark"
      >${text}</text>
    </svg>
  `;

  return sharp(inputBuffer)
    .composite([
      {
        input: Buffer.from(svgText),
        top: 0,
        left: 0,
      },
    ])
    .toBuffer();
}

function getXPosition(
  position: WatermarkOptions["position"],
  width: number,
  margin: number
): number {
  switch (position) {
    case "top-left":
    case "bottom-left":
      return margin;
    case "top-right":
    case "bottom-right":
      return width - margin - 100;
    default:
      return width / 2;
  }
}

function getYPosition(
  position: WatermarkOptions["position"],
  height: number,
  margin: number,
  fontSize: number
): number {
  switch (position) {
    case "top-left":
    case "top-right":
      return margin + fontSize;
    case "bottom-left":
    case "bottom-right":
      return height - margin;
    default:
      return height / 2;
  }
}

export async function convertFormat(
  inputBuffer: Buffer,
  format: ImageFormat,
  options: CompressOptions = {}
): Promise<Buffer> {
  return compressImage(inputBuffer, format, options);
}

export async function addBorder(
  inputBuffer: Buffer,
  options: BorderOptions
): Promise<Buffer> {
  const { width = 10, color = "#000000" } = options;

  return sharp(inputBuffer)
    .extend({
      top: width,
      bottom: width,
      left: width,
      right: width,
      background: color,
    })
    .toBuffer();
}

export async function getImageMetadata(
  inputBuffer: Buffer
): Promise<sharp.Metadata> {
  return sharp(inputBuffer).metadata();
}