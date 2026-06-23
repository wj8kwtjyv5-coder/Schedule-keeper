import { staticFile } from "remotion";

// Vertical reel format, matching the brand's Instagram footage.
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Warm Jamaican-earth palette: deep reds, golds, soil browns, allspice green.
export const COLORS = {
  soil: "#2b1608",
  soilLight: "#4a2710",
  gold: "#e8a73c",
  goldLight: "#f6d488",
  red: "#b1281f",
  scotchOrange: "#e0641c",
  green: "#4c7a2e",
  cream: "#f5efe2",
  ink: "#231a12",
};

export type Product = {
  id: string;
  name: string;
  tagline: string;
  image: string;
  accent: string;
};

// Spice colours used for the settling-particle "tornado" beat.
export const SPICE_COLORS = [
  COLORS.red,
  COLORS.scotchOrange,
  COLORS.gold,
  COLORS.green,
  "#7a3b12", // pimento / allspice berry
  "#c9a24b", // turmeric
];

export const PRODUCTS: Product[] = [
  {
    id: "jerk",
    name: "Jamaican Jerk Spice",
    tagline: "Smoky. Fiery. Unmistakable.",
    image: staticFile("products/jerk.png"),
    accent: COLORS.red,
  },
  {
    id: "curry",
    name: "Jamaican Curry Spice",
    tagline: "Warm, golden, island curry.",
    image: staticFile("products/curry.png"),
    accent: COLORS.gold,
  },
  {
    id: "allpurpose",
    name: "All Purpose Spice",
    tagline: "One blend, every dish.",
    image: staticFile("products/allpurpose.png"),
    accent: COLORS.green,
  },
  {
    id: "chicken",
    name: "Chicken Spice",
    tagline: "Sunday-dinner ready.",
    image: staticFile("products/chicken.png"),
    accent: COLORS.scotchOrange,
  },
  {
    id: "seafood",
    name: "Seafood Spice",
    tagline: "Fresh catch, island heat.",
    image: staticFile("products/seafood.png"),
    accent: COLORS.red,
  },
];
