/**
 * Property-Based Tests for ATS Font Compliance
 * Feature: ats-compliance, Property 1: Standard Font Compliance
 * 
 * These tests validate that all generated documents use only standard PDF fonts
 * and maintain ATS compatibility across all possible inputs.
 */

import fc from 'fast-check';
import { 
  getResumeFont, 
  validateFontCompliance, 
  isStandardFont, 
  getStandardFonts,
  FontValidator,
  type FontConfig 
} from '@/fonts';

describe('ATS Font Compliance Properties', () => {
  describe('Property 1: Standard Font Compliance', () => {
    /**
     * Property: For any font variant (heading, body, minor), the returned font
     * configuration should always use standard PDF fonts and be ATS-compatible
     * Validates: Requirements 1.2, 2.1, 16.2
     */
    it('should always return ATS-compatible fonts for any variant', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('heading', 'body', 'minor'),
          (variant) => {
            const font = getResumeFont(variant);
            
            // Font must be a standard PDF font
            expect(isStandardFont(font.family)).toBe(true);
            
            // Font must pass compliance validation
            expect(validateFontCompliance(font)).toBe(true);
            
            // Font must be in the list of standard fonts
            expect(getStandardFonts()).toContain(font.family);
            
            // Color must be pure black for ATS compatibility
            expect(font.color).toBe('#000000');
            
            // Size must be reasonable for ATS parsing
            expect(font.size).toBeGreaterThanOrEqual(8);
            expect(font.size).toBeLessThanOrEqual(20);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any font configuration, validation should correctly identify
     * ATS compatibility based on standard font usage and black color
     * Validates: Requirements 2.1, 2.6, 16.4
     */
    it('should correctly validate font compliance for any font configuration', () => {
      fc.assert(
        fc.property(
          fc.record({
            family: fc.oneof(
              fc.constantFrom('Helvetica', 'Times-Roman', 'Courier'), // Standard fonts
              fc.constantFrom('Open Sans', 'Arial', 'Comic Sans') // Non-standard fonts
            ),
            size: fc.integer({ min: 6, max: 24 }),
            color: fc.oneof(
              fc.constant('#000000'), // Black
              fc.constant('#333333'), // Dark gray
              fc.constant('#ff0000')  // Red
            )
          }),
          (fontConfig) => {
            const isCompliant = validateFontCompliance(fontConfig);
            const isStandardFontFamily = isStandardFont(fontConfig.family);
            const isBlackColor = fontConfig.color === '#000000';
            const isReasonableSize = fontConfig.size >= 8 && fontConfig.size <= 20;
            
            // Font is compliant if and only if it uses standard font, black color, and reasonable size
            const expectedCompliance = isStandardFontFamily && isBlackColor && isReasonableSize;
            expect(isCompliant).toBe(expectedCompliance);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Standard font detection should be consistent and accurate
     * for all possible font names
     * Validates: Requirements 2.1, 16.2
     */
    it('should correctly identify standard fonts', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (fontName) => {
            const isStandard = isStandardFont(fontName);
            const standardFonts = getStandardFonts();
            
            // A font is standard if and only if it's in the standard fonts list
            expect(isStandard).toBe(standardFonts.includes(fontName));
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Font validator should produce consistent results and
     * proper compliance scores for any font configuration
     * Validates: Requirements 16.4, 17.1
     */
    it('should produce consistent validation results', () => {
      fc.assert(
        fc.property(
          fc.record({
            family: fc.string({ minLength: 1, maxLength: 50 }),
            size: fc.integer({ min: 1, max: 100 }),
            color: fc.oneof(
              fc.constant('#000000'), // Black
              fc.constant('#333333'), // Dark gray  
              fc.constant('#ff0000')  // Red
            )
          }),
          (fontConfig) => {
            const result = FontValidator.validateFontConfig(fontConfig);
            
            // Result should have all required properties
            expect(result).toHaveProperty('isCompliant');
            expect(result).toHaveProperty('issues');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('score');
            
            // Score should be between 0 and 100
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
            
            // If there are error-level issues, document should not be compliant
            const hasErrors = result.issues.some(issue => issue.severity === 'error');
            if (hasErrors) {
              expect(result.isCompliant).toBe(false);
            }
            
            // Timestamp should be recent (within last minute)
            const now = new Date();
            const timeDiff = now.getTime() - result.timestamp.getTime();
            expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: All standard fonts should always pass compliance validation
     * when used with proper configuration
     * Validates: Requirements 2.1, 2.6
     */
    it('should always validate standard fonts as compliant when properly configured', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...getStandardFonts()),
          fc.integer({ min: 9, max: 18 }),
          (standardFont, size) => {
            const fontConfig: FontConfig = {
              family: standardFont,
              size: size,
              color: '#000000'
            };
            
            // Standard fonts with black color and reasonable size should always be compliant
            expect(validateFontCompliance(fontConfig)).toBe(true);
            
            const validationResult = FontValidator.validateFontConfig(fontConfig);
            expect(validationResult.isCompliant).toBe(true);
            expect(validationResult.score).toBe(100); // Perfect score for compliant fonts
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Font Configuration Consistency', () => {
    /**
     * Property: Font configurations should be consistent across multiple calls
     * Validates: Requirements 16.1
     */
    it('should return consistent font configurations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('heading', 'body', 'minor'),
          (variant) => {
            const font1 = getResumeFont(variant);
            const font2 = getResumeFont(variant);
            
            // Multiple calls should return identical configurations
            expect(font1).toEqual(font2);
            expect(font1.family).toBe(font2.family);
            expect(font1.size).toBe(font2.size);
            expect(font1.color).toBe(font2.color);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    /**
     * Test edge cases that might cause issues in font validation
     */
    it('should handle edge cases gracefully', () => {
      // Empty string font name
      expect(isStandardFont('')).toBe(false);
      
      // Null/undefined handling
      expect(isStandardFont(null as any)).toBe(false);
      expect(isStandardFont(undefined as any)).toBe(false);
      
      // Case sensitivity
      expect(isStandardFont('helvetica')).toBe(false); // Should be 'Helvetica'
      expect(isStandardFont('HELVETICA')).toBe(false); // Should be 'Helvetica'
      
      // Whitespace handling
      expect(isStandardFont(' Helvetica ')).toBe(false);
      expect(isStandardFont('Helvetica ')).toBe(false);
      expect(isStandardFont(' Helvetica')).toBe(false);
    });

    /**
     * Test validation with invalid configurations
     */
    it('should properly validate invalid configurations', () => {
      const invalidConfigs = [
        { family: '', size: 12, color: '#000000' },
        { family: 'Helvetica', size: 0, color: '#000000' },
        { family: 'Helvetica', size: 12, color: '' },
        { family: 'Comic Sans', size: 12, color: '#000000' },
        { family: 'Helvetica', size: 12, color: '#ff0000' },
      ];

      invalidConfigs.forEach(config => {
        const result = FontValidator.validateFontConfig(config);
        expect(result.score).toBeLessThan(100);
      });
    });
  });
});