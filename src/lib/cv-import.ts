// CV Import and Parsing Utilities

import { UserProfile, CVParsingResult } from '@/types';

/**
 * Validates uploaded CV file for size, type, and format
 */
export function validateCVFile(file: File): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (file.size > maxSize) {
    errors.push(`File too large. Maximum size is 10MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB`);
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`Unsupported file type. Please upload PDF, DOC, or DOCX files.`);
  }

  if (file.name.length > 255) {
    errors.push('Filename too long. Please rename the file.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Extracts text content from uploaded CV file
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  
  switch (fileType) {
    case 'application/pdf':
      return extractTextFromPDF(file);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractTextFromDOCX(file);
    case 'application/msword':
      throw new Error('DOC files not yet supported. Please convert to DOCX or PDF.');
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Extracts text from PDF file using pdf-parse (server-side only)
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      throw new Error('PDF parsing is not supported in the browser. Please use the server-side API.');
    }
    
    // Dynamic import to avoid SSR issues
    const pdfParse = (await import('pdf-parse')).default;
    const arrayBuffer = await file.arrayBuffer();
    const data = await pdfParse(Buffer.from(arrayBuffer));
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text content found in PDF. The file might be image-based or corrupted.');
    }
    
    return data.text;
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts text from DOCX file using mammoth (client-side compatible)
 */
async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      throw new Error('DOCX parsing is not supported in the browser. Please use the server-side API.');
    }
    
    // Dynamic import to avoid SSR issues
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('No text content found in DOCX file.');
    }
    
    return result.value;
  } catch (error) {
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parses extracted CV text into structured profile data using AI
 */
export async function parseProfileFromCV(
  extractedText: string,
  fileName: string
): Promise<CVParsingResult> {
  if (!extractedText || extractedText.trim().length < 100) {
    return {
      success: false,
      extractedText,
      parsedProfile: {},
      confidence: 0,
      warnings: [],
      errors: ['Extracted text is too short to parse meaningful profile data']
    };
  }

  const prompt = `Extract professional profile information from this CV text and return structured JSON data.

CV Text: ${extractedText}

Extract the following information and return ONLY valid JSON:
{
  "header": {
    "name": "full name",
    "title": "professional title/role",
    "location": "city, country",
    "phone": "phone number",
    "email": "email address",
    "linkedin": "linkedin profile",
    "github": "github profile"
  },
  "summary": "professional summary/profile paragraph",
  "experience": [
    {
      "jobTitle": "job title",
      "company": "company name",
      "location": "city",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or Present",
      "bullets": [
        {
          "categoryLabel": "category (e.g., Python Development)",
          "description": "achievement description with metrics"
        }
      ]
    }
  ],
  "education": [
    {
      "degree": "degree type",
      "field": "field of study",
      "institution": "institution name",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY"
    }
  ],
  "skills": [
    {
      "name": "skill category",
      "skills": [
        {
          "name": "skill name",
          "description": "skill description"
        }
      ]
    }
  ],
  "languages": [
    {
      "name": "language name",
      "proficiency": "proficiency level"
    }
  ],
  "references": [
    {
      "name": "reference name",
      "title": "title",
      "company": "company",
      "email": "email"
    }
  ]
}

Rules:
- Extract only information that is clearly present in the CV
- Use "Present" for current positions
- Group experience bullets by logical categories
- Include metrics and achievements where available
- Return empty arrays for missing sections
- Maintain original language (German/English)`;

  try {
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
            content: 'You are an expert CV parser. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent parsing
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`CV parsing API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Clean markdown fences
    const cleaned = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    try {
      const parsedProfile = JSON.parse(cleaned);
      const profileWithIds = addIdsToProfile(parsedProfile);
      const confidence = calculateParsingConfidence(profileWithIds, extractedText);
      
      return {
        success: true,
        extractedText,
        parsedProfile: profileWithIds,
        confidence,
        warnings: generateParsingWarnings(profileWithIds),
        errors: []
      };
    } catch (parseError) {
      return {
        success: false,
        extractedText,
        parsedProfile: {},
        confidence: 0,
        warnings: [],
        errors: [`Failed to parse CV structure: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`]
      };
    }
  } catch (error) {
    return {
      success: false,
      extractedText,
      parsedProfile: {},
      confidence: 0,
      warnings: [],
      errors: [`CV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Calculates confidence score for parsed profile data
 */
export function calculateParsingConfidence(
  parsed: Partial<UserProfile>,
  _originalText: string
): number {
  let score = 0;
  let maxScore = 0;

  // Header information (40 points max)
  maxScore += 40;
  if (parsed.header?.name) score += 10;
  if (parsed.header?.email) score += 10;
  if (parsed.header?.phone) score += 5;
  if (parsed.header?.title) score += 10;
  if (parsed.header?.location) score += 5;

  // Experience section (30 points max)
  maxScore += 30;
  if (parsed.experience && parsed.experience.length > 0) {
    score += 15;
    if (parsed.experience.some(exp => exp.bullets && exp.bullets.length > 0)) score += 15;
  }

  // Education section (15 points max)
  maxScore += 15;
  if (parsed.education && parsed.education.length > 0) score += 15;

  // Skills section (10 points max)
  maxScore += 10;
  if (parsed.skills && parsed.skills.length > 0) score += 10;

  // Summary section (5 points max)
  maxScore += 5;
  if (parsed.summary) score += 5;

  return Math.round((score / maxScore) * 100);
}

/**
 * Adds unique IDs to all profile entries for React keys
 */
export function addIdsToProfile(parsed: Partial<UserProfile>): Partial<UserProfile> {
  return {
    ...parsed,
    experience: parsed.experience?.map(exp => ({
      ...exp,
      id: crypto.randomUUID(),
      bullets: exp.bullets?.map(bullet => ({
        ...bullet,
        id: crypto.randomUUID()
      })) || []
    })) || [],
    education: parsed.education?.map(edu => ({
      ...edu,
      id: crypto.randomUUID()
    })) || [],
    skills: parsed.skills?.map(skill => ({
      ...skill,
      id: crypto.randomUUID(),
      skills: skill.skills?.map(s => ({ ...s, keywords: [] })) || []
    })) || [],
    languages: parsed.languages?.map(lang => ({
      ...lang,
      id: crypto.randomUUID()
    })) || [],
    references: parsed.references?.map(ref => ({
      ...ref,
      id: crypto.randomUUID()
    })) || []
  };
}

/**
 * Generates warnings for missing or incomplete profile data
 */
export function generateParsingWarnings(parsed: Partial<UserProfile>): string[] {
  const warnings: string[] = [];

  if (!parsed.header?.email) {
    warnings.push("Email address not found - please add manually");
  }
  
  if (!parsed.header?.phone) {
    warnings.push("Phone number not found - please add manually");
  }
  
  if (!parsed.experience || parsed.experience.length === 0) {
    warnings.push("No work experience found - please add manually");
  }
  
  if (!parsed.skills || parsed.skills.length === 0) {
    warnings.push("No skills section found - please add manually");
  }

  if (parsed.experience && parsed.experience.some(exp => !exp.bullets || exp.bullets.length === 0)) {
    warnings.push("Some positions missing achievement details - please review");
  }

  if (!parsed.summary || parsed.summary.length < 50) {
    warnings.push("Professional summary is missing or too short - please review");
  }

  return warnings;
}

/**
 * Processes CV file upload from start to finish using server-side API
 */
export async function processCVUpload(file: File): Promise<CVParsingResult> {
  // Validate file
  const validation = validateCVFile(file);
  if (!validation.isValid) {
    return {
      success: false,
      extractedText: '',
      parsedProfile: {},
      confidence: 0,
      warnings: [],
      errors: validation.errors
    };
  }

  try {
    // Create form data for API request
    const formData = new FormData();
    formData.append('file', file);

    // Send to server-side API for processing
    const response = await fetch('/api/parse-cv', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    return {
      success: false,
      extractedText: '',
      parsedProfile: {},
      confidence: 0,
      warnings: [],
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
}