/**
 * ATS-Compatible Font System
 * 
 * This module provides a complete font management system for generating
 * ATS-compatible resumes. It ensures all generated documents use standard
 * PDF fonts that work with 100% of ATS systems.
 */

// Export font configuration and utilities
export {
  STANDARD_FONTS,
  fontConfig,
  getResumeFont,
  validateFontCompliance,
  getStandardFonts,
  isStandardFont,
  type FontConfig,
  type ResumeFont,
} from './defaultFonts';

// Export validation functionality
export {
  FontValidator,
  type ValidationResult,
  type ValidationIssue,
} from './fontValidator';

// Re-export commonly used functions for convenience
import { getResumeFont } from './defaultFonts';
import { FontValidator } from './fontValidator';

/**
 * Quick validation function for font compliance
 * @param fontFamily - Font family to check
 * @returns true if ATS-compatible
 */
export function isATSCompatible(fontFamily: string): boolean {
  return FontValidator.validateFontConfig({
    family: fontFamily,
    size: 12,
    color: '#000000',
  }).isCompliant;
}

/**
 * Get the default ATS-compatible font configuration
 * @returns Complete font configuration for resumes
 */
export function getDefaultATSFonts() {
  return {
    heading: getResumeFont('heading'),
    body: getResumeFont('body'),
    minor: getResumeFont('minor'),
  };
}