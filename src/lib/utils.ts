import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateFormattedOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomChar = chars.charAt(Math.floor(Math.random() * chars.length));
  const randomNumbers = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  return `${randomChar}${randomNumbers}`;
}
