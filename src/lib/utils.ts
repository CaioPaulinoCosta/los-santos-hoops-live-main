import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a deterministic random number between 0 and 1 based on a string seed.
 * This ensures that the same seed always produces the same "random" sequence.
 */
export function seededRandom(seed: string): () => number {
  // Simple hash function to convert string to numeric seed
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  }
  
  // Mulberry32 PRNG
  return function() {
    h = (h + 0x9e3779b9) | 0;
    let t = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
    t = Math.imul(t ^ (t >>> 15), 0x735a2d97);
    return ((t = (t ^ (t >>> 15)) >>> 0) / 4294967296);
  };
}
