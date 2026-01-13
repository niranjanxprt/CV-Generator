/**
 * ATS-Compatible Font Configuration Module
 * 
 * This module provides standard PDF fonts that are guaranteed to work with
 * all ATS (Applicant Tracking System) software. These fonts are part of the
 * PDF 1.0 specification and don't require embedding, ensuring 100% text
 * extraction compatibility.
 */

// Standard PDF fonts that work with all ATS systems
export const STANDARD_FONTS = {
  HELVETICA: 'Helvetica',
  TIMES_ROMAN: 'Times-Roman', 
  COURIER: 'Courier',
} as const;

// Font configuration for resume generation
export const fontConfig = {
  headingFont: STANDARD_FONTS.HELVETICA,
  bodyFont: STANDARD_FONTS.HELVETICA,
  minorFont: STANDARD_FONTS.HELVETICA,
  contactFont: STANDARD_FONTS.HELVETICA, // For contact info
  headingSize: 16, // 14-16pt for headers (ATS compliant)
  bodySize: 10,    // 10-12pt for body text (ATS compliant)
  minorSize: 9,    // For smaller text but still readable
  contactSize: 8,  // For contact details (minimum readable size)
  color: '#000000', // Pure black for maximum ATS readability
} as const;

export interface FontConfig {
  family: string;
  size: number;
  color: string;
}

export interface ResumeFont {
  heading: FontConfig;
  body: FontConfig;
  minor: FontConfig;
  contact: FontConfig;
}

/**
 * Factory function to get consistent font configuration
 * @param variant - The font variant to retrieve
 * @returns FontConfig object with family, size, and color
 */
export function getResumeFont(variant: 'heading' | 'body' | 'minor' | 'contact'): FontConfig {
  const baseConfig = {
    family: fontConfig[`${variant}Font` as keyof typeof fontConfig] as string,
    size: fontConfig[`${variant}Size` as keyof typeof fontConfig] as number,
    color: fontConfig.color,
  };
  
  return baseConfig;
}

/**
 * Validates that a font configuration is ATS-compatible
 * @param fontConfig - The font configuration to validate
 * @returns true if ATS-compatible, false otherwise
 */
export function validateFontCompliance(fontConfig: FontConfig): boolean {
  const allowedFonts = Object.values(STANDARD_FONTS);
  
  // Check if font is in allowed list
  if (!allowedFonts.includes(fontConfig.family as any)) {
    console.warn(`Font ${fontConfig.family} may not be ATS-compatible`);
    return false;
  }
  
  // Ensure color is pure black for maximum readability
  if (fontConfig.color !== '#000000') {
    console.warn(`Non-black text (${fontConfig.color}) may affect ATS parsing`);
    return false;
  }
  
  // Check reasonable font sizes
  if (fontConfig.size < 8 || fontConfig.size > 20) {
    console.warn(`Font size ${fontConfig.size} may not be optimal for ATS`);
    return false;
  }
  
  return true;
}

/**
 * Get all standard fonts for validation purposes
 */
export function getStandardFonts(): readonly string[] {
  return Object.values(STANDARD_FONTS);
}

/**
 * Check if a font name is a standard PDF font
 */
export function isStandardFont(fontName: string): boolean {
  return Object.values(STANDARD_FONTS).includes(fontName as any);
}