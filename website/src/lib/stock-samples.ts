import type { StaticImageData } from "next/image";
import st1 from "../../assets/stock_images/st1.jpg";
import st2 from "../../assets/stock_images/st2.jpg";
import st3 from "../../assets/stock_images/st3.jpg";
import st4 from "../../assets/stock_images/st4.jpg";
import st5 from "../../assets/stock_images/st5.png";
import st6 from "../../assets/stock_images/st6.png";
import st7 from "../../assets/stock_images/st7.jpg";
import st8 from "../../assets/stock_images/st8.jpg";
import st9 from "../../assets/stock_images/st9.png";
import st10 from "../../assets/stock_images/st10.png";
import st11 from "../../assets/stock_images/st11.png";

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
    id: "meme",
    label: "Meme",
    description: "Fine edges",
    fileName: "st5.png",
    image: st5,
  },
  {
    id: "girl",
    label: "Portrait",
    description: "Outdoor light",
    fileName: "st6.png",
    image: st6,
  },
  {
    id: "spider man",
    label: "Spider Man",
    description: "Super man",
    fileName: "st10.jpg",
    image: st10,
  },
  {
    id: "salt boy",
    label: "salt Boy",
    description: "Salt boy",
    fileName: "st9.png",
    image: st9,
  },
]

export const mainsample = [
  {
    id: "salt boy",
    label: "salt Boy",
    description: "Salt boy",
    fileName: "st8.jpg",
    image: st8,
  },
  {
    id: "bug",
    label: "bug",
    description: "bug",
    fileName: "st7.png",
    image: st7,
  },
  {
    id: "modi",
    label: "Modi",
    description: "Political leader",
    fileName: "st11.png",
    image: st11,
  },
] 