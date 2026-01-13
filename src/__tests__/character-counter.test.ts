/**
 * Property-Based Tests for Character Counter Accuracy
 * Feature: cv-cover-letter-generator, Property 3: Character Counter Accuracy
 * Validates: Requirements 2.2
 */

import * as fc from 'fast-check';

// Character counter implementation
function getCharacterCount(text: string): number {
  if (typeof text !== 'string') {
    return 0;
  }
  return text.length;
}

function formatCharacterCount(current: number, max: number): string {
  return `${current}/${max} characters`;
}

function isWithinLimit(current: number, max: number): boolean {
  return current <= max;
}

function getCharacterCountStatus(current: number, max: number): 'valid' | 'warning' | 'error' {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  
  if (current > max) {
    return 'error';
  } else if (percentage > 90) {
    return 'warning';
  } else {
    return 'valid';
  }
}

function getRemainingCharacters(current: number, max: number): number {
  return Math.max(0, max - current);
}

describe('Character Counter Accuracy Property Tests', () => {
  /**
   * Property 3a: Character Count Accuracy
   * For any string, the character count should exactly match the string length
   */
  test('Property 3a: Character count is always accurate', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (text) => {
          const count = getCharacterCount(text);
          
          // Count should exactly match string length
          expect(count).toBe(text.length);
          
          // Count should never be negative
          expect(count).toBeGreaterThanOrEqual(0);
          
          // Count should be an integer
          expect(Number.isInteger(count)).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 3b: Character Count Consistency
   * For any string, multiple calls to getCharacterCount should return the same result
   */
  test('Property 3b: Character count is consistent', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (text) => {
          const count1 = getCharacterCount(text);
          const count2 = getCharacterCount(text);
          const count3 = getCharacterCount(text);
          
          // All counts should be identical
          expect(count1).toBe(count2);
          expect(count2).toBe(count3);
          expect(count1).toBe(count3);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 3c: Unicode Character Handling
   * For any string including unicode characters, count should be accurate
   */
  test('Property 3c: Unicode characters are counted correctly', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string({ minLength: 0, maxLength: 10 }), // Add some regular chars
        (baseText, regularChars) => {
          // Add some known unicode characters
          const unicodeChars = '🚀🎉💻🌟🔥';
          const combinedText = baseText + regularChars + unicodeChars;
          const count = getCharacterCount(combinedText);
          
          // Count should match the actual string length
          expect(count).toBe(combinedText.length);
          
          // Should handle empty strings
          if (combinedText === '') {
            expect(count).toBe(0);
          }
          
          // Should handle unicode correctly
          expect(getCharacterCount(unicodeChars)).toBe(unicodeChars.length);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 3d: Format Display Consistency
   * For any current count and max limit, the formatted display should be consistent
   */
  test('Property 3d: Character count format is consistent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20000 }),
        fc.integer({ min: 1, max: 20000 }),
        (current, max) => {
          const formatted1 = formatCharacterCount(current, max);
          const formatted2 = formatCharacterCount(current, max);
          
          // Same inputs should produce same output
          expect(formatted1).toBe(formatted2);
          
          // Format should contain both numbers
          expect(formatted1).toContain(current.toString());
          expect(formatted1).toContain(max.toString());
          expect(formatted1).toContain('/');
          expect(formatted1).toContain('characters');
          
          // Format should be a non-empty string
          expect(typeof formatted1).toBe('string');
          expect(formatted1.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 3e: Limit Validation Accuracy
   * For any current count and max limit, limit validation should be accurate
   */
  test('Property 3e: Limit validation is accurate', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20000 }),
        fc.integer({ min: 1, max: 20000 }),
        (current, max) => {
          const withinLimit = isWithinLimit(current, max);
          
          // Should be true if and only if current <= max
          expect(withinLimit).toBe(current <= max);
          
          // Result should be boolean
          expect(typeof withinLimit).toBe('boolean');
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 3f: Status Classification Accuracy
   * For any current count and max limit, status should be correctly classified
   */
  test('Property 3f: Status classification is accurate', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20000 }),
        fc.integer({ min: 1, max: 20000 }),
        (current, max) => {
          const status = getCharacterCountStatus(current, max);
          const percentage = (current / max) * 100;
          
          // Status should be one of the valid values
          expect(['valid', 'warning', 'error']).toContain(status);
          
          // Status should be correct based on rules
          if (current > max) {
            expect(status).toBe('error');
          } else if (percentage > 90) {
            expect(status).toBe('warning');
          } else {
            expect(status).toBe('valid');
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 3g: Remaining Characters Calculation
   * For any current count and max limit, remaining characters should be calculated correctly
   */
  test('Property 3g: Remaining characters calculation is accurate', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20000 }),
        fc.integer({ min: 1, max: 20000 }),
        (current, max) => {
          const remaining = getRemainingCharacters(current, max);
          
          // Remaining should never be negative
          expect(remaining).toBeGreaterThanOrEqual(0);
          
          // Remaining should be correct calculation
          if (current <= max) {
            expect(remaining).toBe(max - current);
          } else {
            expect(remaining).toBe(0);
          }
          
          // Should be an integer
          expect(Number.isInteger(remaining)).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 3h: Edge Cases Handling
   * For edge cases (empty strings, very long strings), counter should handle correctly
   */
  test('Property 3h: Edge cases are handled correctly', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''), // Empty string
          fc.string({ minLength: 10000, maxLength: 15000 }), // Very long string
          fc.string({ minLength: 1, maxLength: 1 }), // Single character
          fc.constant(' '.repeat(1000)) // Whitespace only
        ),
        (edgeCase) => {
          const count = getCharacterCount(edgeCase);
          
          // Count should still be accurate
          expect(count).toBe(edgeCase.length);
          
          // Should handle all edge cases without errors
          expect(typeof count).toBe('number');
          expect(count).toBeGreaterThanOrEqual(0);
          
          // Formatting should work for edge cases
          const formatted = formatCharacterCount(count, 10000);
          expect(typeof formatted).toBe('string');
          expect(formatted.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 3i: Real-time Update Simulation
   * For any sequence of text changes, counter should update accurately
   */
  test('Property 3i: Real-time updates are accurate', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ maxLength: 100 }), { minLength: 1, maxLength: 10 }),
        (textSequence) => {
          const counts: number[] = [];
          
          // Simulate typing sequence
          textSequence.forEach(text => {
            const count = getCharacterCount(text);
            counts.push(count);
            
            // Each count should be accurate for its text
            expect(count).toBe(text.length);
          });
          
          // All counts should be non-negative integers
          counts.forEach(count => {
            expect(count).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(count)).toBe(true);
          });
          
          // Counts should correspond to text lengths
          textSequence.forEach((text, index) => {
            expect(counts[index]).toBe(text.length);
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 3j: Boundary Conditions
   * For boundary conditions around limits, counter should behave correctly
   */
  test('Property 3j: Boundary conditions are handled correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        (limit) => {
          // Test exactly at limit
          const atLimit = 'x'.repeat(limit);
          const countAtLimit = getCharacterCount(atLimit);
          expect(countAtLimit).toBe(limit);
          expect(isWithinLimit(countAtLimit, limit)).toBe(true);
          expect(getCharacterCountStatus(countAtLimit, limit)).toBe('warning'); // Should be warning at 100%
          
          // Test one over limit
          const overLimit = 'x'.repeat(limit + 1);
          const countOverLimit = getCharacterCount(overLimit);
          expect(countOverLimit).toBe(limit + 1);
          expect(isWithinLimit(countOverLimit, limit)).toBe(false);
          expect(getCharacterCountStatus(countOverLimit, limit)).toBe('error');
          
          // Test one under limit
          if (limit > 1) {
            const underLimit = 'x'.repeat(limit - 1);
            const countUnderLimit = getCharacterCount(underLimit);
            expect(countUnderLimit).toBe(limit - 1);
            expect(isWithinLimit(countUnderLimit, limit)).toBe(true);
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});