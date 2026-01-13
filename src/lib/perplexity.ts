// Perplexity API Integration

import { JobAnalysis } from '@/types';

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastCallTime = 0;
  private minInterval = 1000; // 1 second between calls

  async callAPI<T>(apiCall: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const now = Date.now();
          const timeSinceLastCall = now - this.lastCallTime;
          
          if (timeSinceLastCall < this.minInterval) {
            await new Promise(r => setTimeout(r, this.minInterval - timeSinceLastCall));
          }
          
          this.lastCallTime = Date.now();
          const result = await apiCall();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    while (this.queue.length > 0) {
      const call = this.queue.shift();
      if (call) await call();
    }
    this.processing = false;
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Analyzes job description using Perplexity API
 */
export async function analyzeJobWithPerplexity(
  jobDescription: string,
  apiKey?: string
): Promise<JobAnalysis> {
  if (!jobDescription || jobDescription.trim().length < 50) {
    throw new Error('Job description must be at least 50 characters long');
  }

  // Check for API key - prioritize parameter, then environment variables
  const finalApiKey = apiKey || 
    process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || 
    process.env.PERPLEXITY_API_KEY;
    
  if (!finalApiKey || finalApiKey === 'your_perplexity_api_key_here') {
    throw new Error('API key required. Please provide your Perplexity API key.');
  }

  const prompt = `Analyze this job description and extract key information.

Job Description: ${jobDescription}

Output ONLY valid JSON in this structure:
{
  "jobTitle": "exact job title",
  "companyName": "company name (if mentioned)",
  "mustHaveKeywords": ["5-10 critical keywords"],
  "preferredKeywords": ["5-10 important keywords"],
  "niceToHaveKeywords": ["3-8 bonus keywords"],
  "languageRequirement": "German" or "English" or "Both"
}

Prioritize keywords that appear 3+ times or are emphasized.`;

  return rateLimiter.callAPI(async () => {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${finalApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR analyst. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your Perplexity API configuration.');
      }
      if (response.status >= 500) {
        throw new Error('Perplexity API is temporarily unavailable. Please try again later.');
      }
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Perplexity API');
    }

    const content = data.choices[0].message.content;

    // Clean markdown fences
    const cleaned = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      
      // Validate required fields
      if (!parsed.jobTitle || !parsed.mustHaveKeywords || !Array.isArray(parsed.mustHaveKeywords)) {
        throw new Error('Invalid job analysis format');
      }

      return {
        jobTitle: parsed.jobTitle || 'Unknown Position',
        companyName: parsed.companyName || '',
        mustHaveKeywords: parsed.mustHaveKeywords || [],
        preferredKeywords: parsed.preferredKeywords || [],
        niceToHaveKeywords: parsed.niceToHaveKeywords || [],
        languageRequirement: parsed.languageRequirement || 'English'
      };
    } catch (parseError) {
      throw new Error('Failed to parse job analysis response');
    }
  });
}

/**
 * Caching system for job analysis results
 */
class JobAnalysisCache {
  private cache = new Map<string, { data: JobAnalysis; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  private hashJobDescription(jobDescription: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < jobDescription.length; i++) {
      const char = jobDescription.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  get(jobDescription: string): JobAnalysis | null {
    const key = this.hashJobDescription(jobDescription);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  set(jobDescription: string, analysis: JobAnalysis): void {
    const key = this.hashJobDescription(jobDescription);
    this.cache.set(key, {
      data: analysis,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global cache instance
const jobAnalysisCache = new JobAnalysisCache();

/**
 * Analyzes job with caching support
 */
export async function analyzeJobWithCaching(jobDescription: string, apiKey?: string): Promise<JobAnalysis> {
  // Check cache first
  const cached = jobAnalysisCache.get(jobDescription);
  if (cached) {
    return cached;
  }

  // Analyze with API
  const analysis = await analyzeJobWithPerplexity(jobDescription, apiKey);
  
  // Cache the result
  jobAnalysisCache.set(jobDescription, analysis);
  
  return analysis;
}

/**
 * Utility functions for keyword processing
 */
export function extractTopKeywords(jobAnalysis: JobAnalysis, count: number): string[] {
  // Filter out empty/whitespace-only keywords and create weighted list
  const weightedKeywords = [
    ...jobAnalysis.mustHaveKeywords
      .filter(kw => kw && kw.trim().length > 0)
      .map(kw => ({ keyword: kw.trim(), weight: 3 })),
    ...jobAnalysis.preferredKeywords
      .filter(kw => kw && kw.trim().length > 0)
      .map(kw => ({ keyword: kw.trim(), weight: 2 })),
    ...jobAnalysis.niceToHaveKeywords
      .filter(kw => kw && kw.trim().length > 0)
      .map(kw => ({ keyword: kw.trim(), weight: 1 }))
  ];

  // Remove duplicates, keeping the highest weight
  const keywordMap = new Map<string, number>();
  weightedKeywords.forEach(({ keyword, weight }) => {
    const existing = keywordMap.get(keyword);
    if (!existing || weight > existing) {
      keywordMap.set(keyword, weight);
    }
  });

  // Convert back to array and sort by weight, then alphabetically for consistency
  return Array.from(keywordMap.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]; // Sort by weight descending
      return a[0].localeCompare(b[0]); // Then alphabetically for consistency
    })
    .slice(0, count)
    .map(([keyword]) => keyword);
}

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

export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}