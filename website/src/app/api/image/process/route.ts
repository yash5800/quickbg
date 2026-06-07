import { NextRequest, NextResponse } from "next/server";
import {
  resizeImage,
  compressImage,
  applyFilters,
  addWatermark,
  convertFormat,
  addBorder,
  ImageFormat,
  ResizeOptions,
  CompressOptions,
  FiltersOptions,
  WatermarkOptions,
  BorderOptions,
} from "@/lib/image-processing";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const operation = formData.get("operation") as string;

    if (!file) {
      return NextResponse.json(
        { error: "_no_file", message: "No file provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    let outputBuffer: Buffer;
    let contentType = "image/png";
    let filename = file.name;

    switch (operation) {
      case "resize": {
        const width = parseInt(formData.get("width") as string) || undefined;
        const height = parseInt(formData.get("height") as string) || undefined;
        const fit = (formData.get("fit") as ResizeOptions["fit"]) || "cover";
        const position = (formData.get("position") as ResizeOptions["position"]) || "center";

        const options: ResizeOptions = { width, height, fit, position };
        outputBuffer = await resizeImage(inputBuffer, options);
        break;
      }

      case "compress": {
        const quality = parseInt(formData.get("quality") as string) || 80;
        const format = (formData.get("format") as ImageFormat) || "png";

        const options: CompressOptions = { quality };
        outputBuffer = await compressImage(inputBuffer, format, options);
        contentType = `image/${format === "jpg" ? "jpeg" : format}`;
        filename = `${file.name.split(".")[0]}.${format}`;
        break;
      }

      case "filters": {
        const brightness = parseFloat(formData.get("brightness") as string) || 1;
        const contrast = parseFloat(formData.get("contrast") as string) || 1;
        const saturation = parseFloat(formData.get("saturation") as string) || 1;
        const grayscale = formData.get("grayscale") === "true";
        const blur = parseFloat(formData.get("blur") as string) || 0;
        const sharpen = parseFloat(formData.get("sharpen") as string) || 0;
        const rotate = parseInt(formData.get("rotate") as string) || 0;
        const flip = formData.get("flip") === "true";
        const flop = formData.get("flop") === "true";

        const options: FiltersOptions = {
          brightness,
          contrast,
          saturation,
          grayscale,
          blur,
          sharpen,
          rotate,
          flip,
          flop,
        };
        outputBuffer = await applyFilters(inputBuffer, options);
        break;
      }

      case "watermark": {
        const text = formData.get("text") as string;
        const fontSize = parseInt(formData.get("fontSize") as string) || 24;
        const color = (formData.get("color") as string) || "white";
        const opacity = parseFloat(formData.get("opacity") as string) || 0.5;
        const position = (formData.get("position") as WatermarkOptions["position"]) || "bottom-right";
        const margin = parseInt(formData.get("margin") as string) || 20;

        const options: WatermarkOptions = {
          text,
          fontSize,
          color,
          opacity,
          position,
          margin,
        };
        outputBuffer = await addWatermark(inputBuffer, options);
        break;
      }

      case "border": {
        const width = parseInt(formData.get("width") as string) || 10;
        const color = (formData.get("color") as string) || "#000000";

        const options: BorderOptions = { width, color };
        outputBuffer = await addBorder(inputBuffer, options);
        break;
      }

      case "convert": {
        const format = (formData.get("format") as ImageFormat) || "png";
        const quality = parseInt(formData.get("quality") as string) || 80;

        const options: CompressOptions = { quality };
        outputBuffer = await convertFormat(inputBuffer, format, options);
        contentType = `image/${format === "jpg" ? "jpeg" : format}`;
        filename = `${file.name.split(".")[0]}.${format}`;
        break;
      }

      default:
        return NextResponse.json(
          { error: "_invalid_operation", message: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Image processing error:", error);
    return NextResponse.json(
      { error: "_processing_error", message: "Failed to process image" },
      { status: 500 }
    );
  }
}