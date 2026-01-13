// Client-side CV Import functionality

import { CVParsingResult } from '@/types';

/**
 * Validates uploaded CV file for size, type, and format (client-side)
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
 * Processes CV file upload using server-side API
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