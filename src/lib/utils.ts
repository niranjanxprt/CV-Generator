import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Group array by key
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// Hash string for caching
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

// Extract top keywords from job analysis
export function extractTopKeywords(jobAnalysis: any, count: number): string[] {
  const weightedKeywords = [
    ...jobAnalysis.mustHaveKeywords.map((kw: string) => ({ keyword: kw, weight: 3 })),
    ...jobAnalysis.preferredKeywords.map((kw: string) => ({ keyword: kw, weight: 2 })),
    ...jobAnalysis.niceToHaveKeywords.map((kw: string) => ({ keyword: kw, weight: 1 }))
  ];

  return weightedKeywords
    .sort((a, b) => b.weight - a.weight)
    .slice(0, count)
    .map(item => item.keyword);
}