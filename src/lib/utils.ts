import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function latinFace(concept: { category: string }) {
  return concept.category === "bpm" ? "numeric" : "font-en tracking-[-0.02em]";
}
