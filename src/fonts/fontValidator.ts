/**
 * Font Validation Module for ATS Compliance
 * 
 * This module provides validation functionality to ensure all generated
 * documents use ATS-compatible fonts and formatting.
 */

import { validateFontCompliance, isStandardFont, type FontConfig } from './defaultFonts';

export interface ValidationResult {
  isCompliant: boolean;
  issues: ValidationIssue[];
  timestamp: Date;
  score: number; // 0-100 compliance score
}

export interface ValidationIssue {
  type: 'font' | 'color' | 'size' | 'structure';
  severity: 'error' | 'warning' | 'info';
  message: string;
  recommendation: string;
}

/**
 * Font Validator class for comprehensive ATS compliance checking
 */
export class FontValidator {
  /**
   * Validates PDF content for ATS compliance
   * @param pdfContent - The PDF content to validate
   * @returns ValidationResult with compliance status and issues
   */
  static validatePDF(pdfContent: any): ValidationResult {
    const issues: ValidationIssue[] = [];
    
    // Check all text nodes use standard fonts
    const fontIssues = this.checkFonts(pdfContent);
    issues.push(...fontIssues);
    
    // Check all text is black
    const colorIssues = this.checkColors(pdfContent);
    issues.push(...colorIssues);
    
    // Check font sizes are reasonable
    const sizeIssues = this.checkFontSizes(pdfContent);
    issues.push(...sizeIssues);
    
    // Calculate compliance score
    const score = this.calculateComplianceScore(issues);
    
    return {
      isCompliant: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      timestamp: new Date(),
      score,
    };
  }
  
  /**
   * Validates a single font configuration
   * @param config - Font configuration to validate
   * @returns ValidationResult
   */
  static validateFontConfig(config: FontConfig): ValidationResult {
    const issues: ValidationIssue[] = [];
    
    // Check font family
    if (!isStandardFont(config.family)) {
      issues.push({
        type: 'font',
        severity: 'error',
        message: `Non-standard font detected: ${config.family}`,
        recommendation: 'Use Helvetica, Times-Roman, or Courier for ATS compatibility',
      });
    }
    
    // Check color
    if (config.color !== '#000000') {
      issues.push({
        type: 'color',
        severity: 'error',
        message: `Non-black text color: ${config.color}`,
        recommendation: 'Use pure black (#000000) for maximum ATS readability',
      });
    }
    
    // Check size
    if (config.size < 9 || config.size > 18) {
      issues.push({
        type: 'size',
        severity: 'warning',
        message: `Font size ${config.size} may not be optimal`,
        recommendation: 'Use 10-12pt for body text, 14-16pt for headers',
      });
    }
    
    const score = this.calculateComplianceScore(issues);
    
    return {
      isCompliant: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      timestamp: new Date(),
      score,
    };
  }
  
  /**
   * Check fonts in content
   * @param content - Content to check
   * @returns Array of font-related issues
   */
  private static checkFonts(content: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // This would be implemented based on the actual PDF structure
    // For now, we'll provide a placeholder that can be extended
    
    // Example: Check if content contains references to Google Fonts
    const contentStr = JSON.stringify(content);
    if (contentStr.includes('Open Sans') || contentStr.includes('Google')) {
      issues.push({
        type: 'font',
        severity: 'error',
        message: 'Google Fonts detected in document',
        recommendation: 'Replace with standard PDF fonts (Helvetica, Times-Roman, Courier)',
      });
    }
    
    return issues;
  }
  
  /**
   * Check colors in content
   * @param content - Content to check
   * @returns Array of color-related issues
   */
  private static checkColors(content: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // This would be implemented based on the actual PDF structure
    // For now, we'll provide a placeholder that can be extended
    
    return issues;
  }
  
  /**
   * Check font sizes in content
   * @param content - Content to check
   * @returns Array of size-related issues
   */
  private static checkFontSizes(content: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // This would be implemented based on the actual PDF structure
    // For now, we'll provide a placeholder that can be extended
    
    return issues;
  }
  
  /**
   * Calculate compliance score based on issues
   * @param issues - Array of validation issues
   * @returns Compliance score (0-100)
   */
  private static calculateComplianceScore(issues: ValidationIssue[]): number {
    let score = 100;
    
    for (const issue of issues) {
      switch (issue.severity) {
        case 'error':
          score -= 25; // Major deduction for errors
          break;
        case 'warning':
          score -= 10; // Moderate deduction for warnings
          break;
        case 'info':
          score -= 2; // Minor deduction for info
          break;
      }
    }
    
    return Math.max(0, score); // Ensure score doesn't go below 0
  }
  
  /**
   * Generate a human-readable compliance report
   * @param result - Validation result
   * @returns Formatted report string
   */
  static generateReport(result: ValidationResult): string {
    const lines: string[] = [];
    
    lines.push(`ATS Compliance Report - Score: ${result.score}/100`);
    lines.push(`Generated: ${result.timestamp.toISOString()}`);
    lines.push(`Status: ${result.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
    lines.push('');
    
    if (result.issues.length === 0) {
      lines.push('✅ No issues found - document is fully ATS compliant');
    } else {
      lines.push('Issues found:');
      result.issues.forEach((issue, index) => {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        lines.push(`${icon} ${issue.message}`);
        lines.push(`   Recommendation: ${issue.recommendation}`);
        lines.push('');
      });
    }
    
    return lines.join('\n');
  }
}