import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type ResponsiveBreakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

export function getCenteredOddGridItemClass(
  index: number,
  total: number,
  breakpoint: ResponsiveBreakpoint
) {
  if (total % 2 === 0 || index !== total - 1) {
    return "";
  }

  return `${breakpoint}:col-span-2 ${breakpoint}:w-full ${breakpoint}:max-w-[calc(50%-0.5rem)] ${breakpoint}:justify-self-center`;
}
