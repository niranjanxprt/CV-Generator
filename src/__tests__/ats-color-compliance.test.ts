/**
 * Property-Based Tests for ATS Color Compliance
 * Feature: ats-compliance, Property 3: Pure Black Text Color
 * 
 * These tests validate that all generated documents use pure black text color
 * for maximum ATS readability and compatibility.
 */

import fc from 'fast-check';
import { 
  getResumeFont, 
  validateFontCompliance,
  FontValidator,
  type FontConfig 
} from '@/fonts';

describe('ATS Color Compliance Properties', () => {
  describe('Property 3: Pure Black Text Color', () => {
    /**
     * Property: For any font variant, the returned font configuration
     * should always use pure black color (#000000) for maximum ATS readability
     * Validates: Requirements 2.6
     */
    it('should always return pure black color for any font variant', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('heading', 'body', 'minor', 'contact'),
          (variant) => {
            const font = getResumeFont(variant);
            
            // Color must be pure black for ATS compatibility
            expect(font.color).toBe('#000000');
            
            // Font must pass compliance validation (which includes color check)
            expect(validateFontCompliance(font)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any font configuration with pure black color,
     * validation should pass the color compliance check
     * Validates: Requirements 2.6
     */
    it('should validate pure black color as compliant', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Helvetica', 'Times-Roman', 'Courier'),
          fc.integer({ min: 9, max: 18 }),
          (fontFamily, fontSize) => {
            const fontConfig: FontConfig = {
              family: fontFamily,
              size: fontSize,
              color: '#000000' // Pure black
            };
            
            // Pure black color should always pass validation
            expect(validateFontCompliance(fontConfig)).toBe(true);
            
            const validationResult = FontValidator.validateFontConfig(fontConfig);
            expect(validationResult.isCompliant).toBe(true);
            
            // Should not have any color-related issues
            const colorIssues = validationResult.issues.filter(issue => issue.type === 'color');
            expect(colorIssues).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any non-black color, validation should identify
     * it as non-compliant and provide appropriate warnings
     * Validates: Requirements 2.6
     */
    it('should identify non-black colors as non-compliant', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Helvetica', 'Times-Roman', 'Courier'),
          fc.integer({ min: 9, max: 18 }),
          fc.oneof(
            fc.constant('#333333'), // Dark gray
            fc.constant('#666666'), // Medium gray
            fc.constant('#ff0000'), // Red
            fc.constant('#0000ff'), // Blue
            fc.constant('#ffffff')  // White
          ),
          (fontFamily, fontSize, nonBlackColor) => {
            const fontConfig: FontConfig = {
              family: fontFamily,
              size: fontSize,
              color: nonBlackColor
            };
            
            // Non-black colors should fail validation
            expect(validateFontCompliance(fontConfig)).toBe(false);
            
            const validationResult = FontValidator.validateFontConfig(fontConfig);
            
            // Should have color-related issues
            const colorIssues = validationResult.issues.filter(issue => issue.type === 'color');
            expect(colorIssues.length).toBeGreaterThan(0);
            
            // Should have appropriate warning message
            const colorWarning = colorIssues.find(issue => 
              issue.message.includes('Non-black text color')
            );
            expect(colorWarning).toBeDefined();
            expect(colorWarning?.severity).toBe('error');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Color validation should be case-sensitive and exact
     * Only #000000 should be considered valid black
     * Validates: Requirements 2.6
     */
    it('should require exact black color format', () => {
      const testColors = [
        { color: '#000000', shouldPass: true, description: 'exact black' },
        { color: '#000', shouldPass: false, description: 'short black' },
        { color: '#000001', shouldPass: false, description: 'almost black' },
        { color: '#111111', shouldPass: false, description: 'very dark gray' },
        { color: 'black', shouldPass: false, description: 'named color' },
        { color: 'rgb(0,0,0)', shouldPass: false, description: 'rgb format' },
        { color: '#000000 ', shouldPass: false, description: 'with whitespace' },
        { color: ' #000000', shouldPass: false, description: 'leading whitespace' },
      ];

      testColors.forEach(({ color, shouldPass, description }) => {
        const fontConfig: FontConfig = {
          family: 'Helvetica',
          size: 12,
          color: color
        };

        const isCompliant = validateFontCompliance(fontConfig);
        
        if (shouldPass) {
          expect(isCompliant).toBe(true);
        } else {
          expect(isCompliant).toBe(false);
        }
      });
    });

    /**
     * Property: Color compliance should be consistent across multiple validations
     * Validates: Requirements 2.6
     */
    it('should provide consistent color validation results', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('#000000'), // Black
            fc.constant('#ff0000'), // Red
            fc.constant('#333333')  // Gray
          ),
          (color) => {
            const fontConfig: FontConfig = {
              family: 'Helvetica',
              size: 12,
              color: color
            };

            // Multiple validations should return the same result
            const result1 = validateFontCompliance(fontConfig);
            const result2 = validateFontCompliance(fontConfig);
            const result3 = FontValidator.validateFontConfig(fontConfig);
            const result4 = FontValidator.validateFontConfig(fontConfig);

            expect(result1).toBe(result2);
            expect(result3.isCompliant).toBe(result4.isCompliant);
            
            // Results should be consistent between different validation methods
            expect(result1).toBe(result3.isCompliant);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Color Validation Edge Cases', () => {
    /**
     * Test edge cases for color validation
     */
    it('should handle color validation edge cases', () => {
      const edgeCases = [
        { color: '', expected: false, description: 'empty string' },
        { color: null as any, expected: false, description: 'null value' },
        { color: undefined as any, expected: false, description: 'undefined value' },
        { color: '#', expected: false, description: 'incomplete hex' },
        { color: '#00000', expected: false, description: 'incomplete hex (5 chars)' },
        { color: '#0000000', expected: false, description: 'too long hex (7 chars)' },
        { color: '#GGGGGG', expected: false, description: 'invalid hex characters' },
      ];

      edgeCases.forEach(({ color, expected, description }) => {
        const fontConfig: FontConfig = {
          family: 'Helvetica',
          size: 12,
          color: color
        };

        const result = validateFontCompliance(fontConfig);
        expect(result).toBe(expected);
      });
    });

    /**
     * Test that color validation works with different font families and sizes
     */
    it('should validate color consistently across different font configurations', () => {
      const standardFonts = ['Helvetica', 'Times-Roman', 'Courier'];
      const sizes = [9, 10, 11, 12, 14, 16, 18];
      const colors = ['#000000', '#333333', '#ff0000'];

      standardFonts.forEach(family => {
        sizes.forEach(size => {
          colors.forEach(color => {
            const fontConfig: FontConfig = { family, size, color };
            const result = validateFontCompliance(fontConfig);
            
            // Only pure black should pass
            const expectedResult = color === '#000000';
            expect(result).toBe(expectedResult);
          });
        });
      });
    });
  });
});