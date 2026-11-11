import { Lato, Newsreader } from "next/font/google";

// Default UI Font
export const sansFont = Lato({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Secondary Editorial / Reading Font
export const editorialFont = Newsreader({
  subsets: ["latin"],
  variable: "--font-editorial",
  display: "swap",
  style: ["normal", "italic"],
});