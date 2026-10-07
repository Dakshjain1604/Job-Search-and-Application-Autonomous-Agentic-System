import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import path from "path";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a writable data directory path.
 * In serverless environments like Vercel (where process.cwd() is read-only),
 * points to /tmp/.jobscout_data to ensure error-free filesystem operations.
 */
export function getDataDirectory(subDir?: string): string {
  const baseDir = process.env.VERCEL
    ? path.join('/tmp', '.jobscout_data')
    : path.join(process.cwd(), '.data');
  return subDir ? path.join(baseDir, subDir) : baseDir;
}
