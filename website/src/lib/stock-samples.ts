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
    id: "birds",
    label: "Birds",
    description: "Fine edges",
    fileName: "sample-birds.jpg",
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
    id: "matcha-cup",
    label: "Product",
    description: "Object shot",
    fileName: "sample-matcha-cup.jpg",
    image: st3,
  },
  {
    id: "event-people",
    label: "People",
    description: "Busy scene",
    fileName: "sample-event-people.jpg",
    image: st4,
  },
];
