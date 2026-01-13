/**
 * Property-Based Tests for Input Validation Consistency
 * Feature: cv-cover-letter-generator, Property 4: Input Validation Consistency
 * Validates: Requirements 2.3
 */

import * as fc from 'fast-check';

// Input validation functions
function validateJobDescription(input: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!input || typeof input !== 'string') {
    errors.push('Job description is required');
    return { isValid: false, errors };
  }
  
  const trimmed = input.trim();
  
  if (trimmed.length === 0) {
    errors.push('Job description cannot be empty');
  }
  
  if (trimmed.length < 50) {
    errors.push('Job description must be at least 50 characters long');
  }
  
  if (trimmed.length > 10000) {
    errors.push('Job description must be less than 10,000 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateDocumentSelection(selection: string[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const validDocuments = ['germanCV', 'englishCV', 'germanCoverLetter', 'englishCoverLetter'];
  
  if (!Array.isArray(selection)) {
    errors.push('Document selection must be an array');
    return { isValid: false, errors };
  }
  
  if (selection.length === 0) {
    errors.push('At least one document must be selected');
  }
  
  selection.forEach(doc => {
    if (!validDocuments.includes(doc)) {
      errors.push(`Invalid document type: ${doc}`);
    }
  });
  
  // Check for duplicates
  const uniqueSelection = new Set(selection);
  if (uniqueSelection.size !== selection.length) {
    errors.push('Duplicate document selections are not allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateCharacterCount(input: string, maxLength: number): { count: number; isValid: boolean } {
  if (typeof input !== 'string') {
    return { count: 0, isValid: false };
  }
  
  const count = input.length;
  return {
    count,
    isValid: count <= maxLength
  };
}

describe('Input Validation Consistency Property Tests', () => {
  /**
   * Property 4a: Job Description Validation Consistency
   * For any string input, validation should be consistent and deterministic
   */
  test('Property 4a: Job description validation is consistent', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (input) => {
          const result1 = validateJobDescription(input);
          const result2 = validateJobDescription(input);
          
          // Same input should always produce same result
          expect(result1.isValid).toBe(result2.isValid);
          expect(result1.errors).toEqual(result2.errors);
          
          // Validation result should be boolean
          expect(typeof result1.isValid).toBe('boolean');
          expect(typeof result2.isValid).toBe('boolean');
          
          // Errors should be array of strings
          expect(Array.isArray(result1.errors)).toBe(true);
          result1.errors.forEach(error => {
            expect(typeof error).toBe('string');
            expect(error.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 4b: Valid Job Descriptions Pass Validation
   * For any string with length between 50-10000 characters, validation should pass
   */
  test('Property 4b: Valid job descriptions always pass validation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 50, maxLength: 10000 }),
        (validInput) => {
          const result = validateJobDescription(validInput);
          
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 4c: Invalid Job Descriptions Fail Validation
   * For any string shorter than 50 characters or longer than 10000, validation should fail
   */
  test('Property 4c: Invalid job descriptions always fail validation', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string({ maxLength: 49 }), // Too short
          fc.string({ minLength: 10001, maxLength: 15000 }) // Too long
        ),
        (invalidInput) => {
          const result = validateJobDescription(invalidInput);
          
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Should have appropriate error messages
          if (invalidInput.trim().length < 50) {
            // Debug: log the actual errors to understand what's happening
            const hasExpectedError = result.errors.some(error => 
              error.includes('50') || error.includes('empty') || error.includes('characters') || error.includes('required')
            );
            if (!hasExpectedError) {
              console.log('Input:', JSON.stringify(invalidInput));
              console.log('Errors:', result.errors);
            }
            expect(hasExpectedError).toBe(true);
          }
          
          if (invalidInput.length > 10000) {
            expect(result.errors.some(error => 
              error.includes('10,000') || error.includes('10000') || error.includes('characters')
            )).toBe(true);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 4d: Document Selection Validation Consistency
   * For any array of document types, validation should be consistent
   */
  test('Property 4d: Document selection validation is consistent', () => {
    const validDocuments = ['germanCV', 'englishCV', 'germanCoverLetter', 'englishCoverLetter'];
    
    fc.assert(
      fc.property(
        fc.array(fc.oneof(
          fc.constantFrom(...validDocuments),
          fc.string({ minLength: 1, maxLength: 20 }) // Some invalid strings
        )),
        (selection) => {
          const result1 = validateDocumentSelection(selection);
          const result2 = validateDocumentSelection(selection);
          
          // Same input should always produce same result
          expect(result1.isValid).toBe(result2.isValid);
          expect(result1.errors).toEqual(result2.errors);
          
          // If selection is empty, should be invalid
          if (selection.length === 0) {
            expect(result1.isValid).toBe(false);
            expect(result1.errors.some(error => 
              error.toLowerCase().includes('least') || error.toLowerCase().includes('one')
            )).toBe(true);
          }
          
          // If all selections are valid and unique, should be valid
          const allValid = selection.every(doc => validDocuments.includes(doc));
          const allUnique = new Set(selection).size === selection.length;
          
          if (selection.length > 0 && allValid && allUnique) {
            expect(result1.isValid).toBe(true);
            expect(result1.errors).toHaveLength(0);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 4e: Character Count Accuracy
   * For any string and max length, character count should be accurate
   */
  test('Property 4e: Character count is always accurate', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.integer({ min: 0, max: 20000 }),
        (input, maxLength) => {
          const result = validateCharacterCount(input, maxLength);
          
          // Count should match actual string length
          expect(result.count).toBe(input.length);
          
          // Validity should be based on count vs max length
          expect(result.isValid).toBe(input.length <= maxLength);
          
          // Count should never be negative
          expect(result.count).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 4f: Whitespace Handling Consistency
   * For any string with leading/trailing whitespace, validation should handle consistently
   */
  test('Property 4f: Whitespace handling is consistent', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 45, maxLength: 55 }), // Around the 50 char boundary
        fc.string({ maxLength: 10 }), // Whitespace to add
        (content, whitespace) => {
          const withWhitespace = whitespace + content + whitespace;
          const result = validateJobDescription(withWhitespace);
          
          // Should validate based on trimmed content
          const trimmedLength = withWhitespace.trim().length;
          
          if (trimmedLength >= 50 && trimmedLength <= 10000) {
            expect(result.isValid).toBe(true);
          } else {
            expect(result.isValid).toBe(false);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 4g: Error Message Quality
   * For any invalid input, error messages should be descriptive and helpful
   */
  test('Property 4g: Error messages are descriptive and helpful', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''), // Empty string
          fc.string({ maxLength: 10 }), // Too short
          fc.string({ minLength: 10001, maxLength: 12000 }) // Too long
        ),
        (invalidInput) => {
          const result = validateJobDescription(invalidInput);
          
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          
          // All error messages should be non-empty strings
          result.errors.forEach(error => {
            expect(typeof error).toBe('string');
            expect(error.length).toBeGreaterThan(0);
            expect(error.trim()).toBe(error); // No leading/trailing whitespace
          });
          
          // Error messages should be descriptive (contain key terms)
          const allErrors = result.errors.join(' ').toLowerCase();
          if (invalidInput.trim().length === 0) {
            expect(allErrors.includes('empty') || allErrors.includes('required')).toBe(true);
          }
          if (invalidInput.trim().length < 50 && invalidInput.trim().length > 0) {
            expect(allErrors.includes('50') || allErrors.includes('characters')).toBe(true);
          }
          if (invalidInput.length > 10000) {
            expect(allErrors.includes('10,000') || allErrors.includes('characters')).toBe(true);
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});