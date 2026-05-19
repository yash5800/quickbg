import type { StaticImageData } from "next/image";
import st1 from "../../assets/stock_images/st1.jpg";
import st2 from "../../assets/stock_images/st2.jpg";
import st3 from "../../assets/stock_images/st3.jpg";
import st4 from "../../assets/stock_images/st4.jpg";
import st5 from "../../assets/stock_images/st5.jpg";
import st6 from "../../assets/stock_images/st6.jpg";
import st7 from "../../assets/stock_images/st7.jpg";
import st8 from "../../assets/stock_images/st8.jpg";

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

export const stocksamples2: StockSample[] = [
  {
    id: "car",
    label: "Car",
    description: "Fine edges",
    fileName: "st5.jpg",
    image: st5,
  },
  {
    id: "girl",
    label: "Portrait",
    description: "Outdoor light",
    fileName: "st6.jpg",
    image: st6,
  },
  {
    id: "bug",
    label: "Bug",
    description: "Animal shot",
    fileName: "st7.jpg",
    image: st7,
  },
  {
    id: "boy",
    label: "Boy",
    description: "Outdoor style",
    fileName: "st8.jpg",
    image: st8,
  },
]