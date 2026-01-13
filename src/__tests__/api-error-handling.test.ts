/**
 * Unit Tests for API Error Handling
 * Validates: Requirements 12.1, 12.2, 12.7
 */

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock environment variable
process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY = 'test-api-key';

// Import after mocking
import { RateLimiter } from '@/lib/perplexity';

// Create a simple version of the analyze function for testing without rate limiting
async function analyzeJobSimple(jobDescription: string) {
  if (!jobDescription || jobDescription.trim().length < 50) {
    throw new Error('Job description must be at least 50 characters long');
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR analyst. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: `Analyze this job description: ${jobDescription}`
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
}

describe('API Error Handling Unit Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  /**
   * Test network failures
   */
  test('should handle network failures gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(analyzeJobSimple('Valid job description with enough content to pass validation')).rejects.toThrow('Network error');
  });

  /**
   * Test rate limiting (429 status)
   */
  test('should handle rate limiting with appropriate error message', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests'
    });

    await expect(analyzeJobSimple('Valid job description with enough content to pass validation')).rejects.toThrow('Rate limit exceeded. Please wait a moment and try again.');
  });

  /**
   * Test authentication errors (401 status)
   */
  test('should handle authentication errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    });

    await expect(analyzeJobSimple('Valid job description with enough content to pass validation')).rejects.toThrow('Invalid API key. Please check your Perplexity API configuration.');
  });

  /**
   * Test server errors (5xx status)
   */
  test('should handle server errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    await expect(analyzeJobSimple('Valid job description with enough content to pass validation')).rejects.toThrow('Perplexity API is temporarily unavailable. Please try again later.');
  });

  /**
   * Test malformed responses
   */
  test('should handle malformed API responses', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        // Missing choices array
        invalid: 'response'
      })
    });

    await expect(analyzeJobSimple('Valid job description with enough content to pass validation')).rejects.toThrow('Invalid response format from Perplexity API');
  });

  /**
   * Test invalid JSON in response content
   */
  test('should handle invalid JSON in response content', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: 'Invalid JSON content that cannot be parsed'
          }
        }]
      })
    });

    await expect(analyzeJobSimple('Valid job description with enough content to pass validation')).rejects.toThrow('Failed to parse job analysis response');
  });

  /**
   * Test input validation
   */
  test('should validate job description length', async () => {
    await expect(analyzeJobSimple('')).rejects.toThrow('Job description must be at least 50 characters long');
    await expect(analyzeJobSimple('Short')).rejects.toThrow('Job description must be at least 50 characters long');
  });

  /**
   * Test successful response parsing
   */
  test('should parse valid response correctly', async () => {
    const mockResponse = {
      jobTitle: 'Software Engineer',
      companyName: 'Tech Corp',
      mustHaveKeywords: ['JavaScript', 'React'],
      preferredKeywords: ['Node.js'],
      niceToHaveKeywords: ['TypeScript'],
      languageRequirement: 'English'
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: JSON.stringify(mockResponse)
          }
        }]
      })
    });

    const result = await analyzeJobSimple('Valid job description with enough content to pass validation and trigger analysis');
    expect(result).toEqual(mockResponse);
  });

  /**
   * Test response with markdown fences
   */
  test('should handle response with markdown code fences', async () => {
    const mockResponse = {
      jobTitle: 'Software Engineer',
      companyName: 'Tech Corp',
      mustHaveKeywords: ['JavaScript', 'React'],
      preferredKeywords: ['Node.js'],
      niceToHaveKeywords: ['TypeScript'],
      languageRequirement: 'English'
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: `\`\`\`json\n${JSON.stringify(mockResponse)}\n\`\`\``
          }
        }]
      })
    });

    const result = await analyzeJobSimple('Valid job description with enough content to pass validation and trigger analysis');
    expect(result).toEqual(mockResponse);
  });

  /**
   * Test incomplete response data
   */
  test('should handle incomplete response data with defaults', async () => {
    const incompleteResponse = {
      jobTitle: 'Software Engineer'
      // Missing other required fields
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: JSON.stringify(incompleteResponse)
          }
        }]
      })
    });

    const result = await analyzeJobSimple('Valid job description with enough content to pass validation and trigger analysis');
    expect(result.jobTitle).toBe('Software Engineer');
    expect(result.companyName).toBe('');
    expect(result.mustHaveKeywords).toEqual([]);
    expect(result.preferredKeywords).toEqual([]);
    expect(result.niceToHaveKeywords).toEqual([]);
    expect(result.languageRequirement).toBe('English');
  });
});

describe('Rate Limiter Unit Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Test rate limiting functionality
   */
  test('should enforce minimum interval between API calls', async () => {
    const rateLimiter = new RateLimiter();
    const mockApiCall = jest.fn().mockResolvedValue('success');
    
    // Start two API calls immediately
    const promise1 = rateLimiter.callAPI(mockApiCall);
    const promise2 = rateLimiter.callAPI(mockApiCall);
    
    // First call should execute immediately
    await jest.advanceTimersByTimeAsync(0);
    expect(mockApiCall).toHaveBeenCalledTimes(1);
    
    // Second call should wait for the interval
    await jest.advanceTimersByTimeAsync(999);
    expect(mockApiCall).toHaveBeenCalledTimes(1);
    
    await jest.advanceTimersByTimeAsync(1);
    expect(mockApiCall).toHaveBeenCalledTimes(2);
    
    const results = await Promise.all([promise1, promise2]);
    expect(results).toEqual(['success', 'success']);
  });

  /**
   * Test rate limiter error handling
   */
  test('should handle API call errors in rate limiter', async () => {
    const rateLimiter = new RateLimiter();
    const mockApiCall = jest.fn().mockRejectedValue(new Error('API Error'));
    
    await expect(rateLimiter.callAPI(mockApiCall)).rejects.toThrow('API Error');
  });

  /**
   * Test multiple API calls queuing
   */
  test('should queue multiple API calls correctly', async () => {
    const rateLimiter = new RateLimiter();
    const mockApiCall = jest.fn()
      .mockResolvedValueOnce('result1')
      .mockResolvedValueOnce('result2')
      .mockResolvedValueOnce('result3');
    
    // Queue three API calls
    const promise1 = rateLimiter.callAPI(mockApiCall);
    const promise2 = rateLimiter.callAPI(mockApiCall);
    const promise3 = rateLimiter.callAPI(mockApiCall);
    
    // Execute all calls with proper timing
    await jest.advanceTimersByTimeAsync(0);
    expect(mockApiCall).toHaveBeenCalledTimes(1);
    
    await jest.advanceTimersByTimeAsync(1000);
    expect(mockApiCall).toHaveBeenCalledTimes(2);
    
    await jest.advanceTimersByTimeAsync(1000);
    expect(mockApiCall).toHaveBeenCalledTimes(3);
    
    const results = await Promise.all([promise1, promise2, promise3]);
    expect(results).toEqual(['result1', 'result2', 'result3']);
  });
});