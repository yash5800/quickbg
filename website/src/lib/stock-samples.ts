import type { StaticImageData } from "next/image";
import st1 from "../../assets/stock_images/st1.jpg";
import st2 from "../../assets/stock_images/st2.jpg";
import st3 from "../../assets/stock_images/st3.jpg";
import st4 from "../../assets/stock_images/st4.jpg";

export interface StockSample {
  id: string;
  label: string;
  description: string;
  fileName: string;
  image: StaticImageData;
}

export const stockSamples: StockSample[] = [
  {
    id: "african-monkey",
    label: "African Monkey",
    description: "Fine edges",
    fileName: "sample-african-monkey.jpg",
    image: st1,
  },
  {
    id: "beach-portrait",
    label: "Portrait",
    description: "Outdoor light",
    fileName: "sample-beach-portrait.jpg",
    image: st2,
  },
  {
    id: "sports-car",
    label: "Product",
    description: "Object shot",
    fileName: "sample-sports-car.jpg",
    image: st3,
  },
  {
    id: "anime-girl",
    label: "Anime Girl",
    description: "Anime style",
    fileName: "sample-anime-girl.jpg",
    image: st4,
  },
];
