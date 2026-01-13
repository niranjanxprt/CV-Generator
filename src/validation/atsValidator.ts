/**
 * ATS Validation and Scoring System
 * 
 * This module provides comprehensive ATS compliance validation and scoring
 * functionality, including integration with external scoring services.
 * 
 * Requirements: 11.2, 11.3, 19.3, 11.1, 17.1
 */

import { TextExtractor, TextExtractionResult } from './textExtractor';
import { FontValidator, ValidationResult } from '@/fonts/fontValidator';
import { UserProfile, TailoredContent } from '@/types';

export interface ATSScore {
  overall: number; // 0-100 overall ATS compatibility score
  breakdown: {
    textExtraction: number; // Text extraction success rate
    fontCompliance: number; // Font compliance score
    structureCompliance: number; // Document structure score
    keywordOptimization: number; // Keyword optimization score
    formatCompliance: number; // Format-specific compliance
  };
  recommendations: string[];
  issues: ATSValidationIssue[];
  timestamp: Date;
}

export interface ATSValidationIssue {
  category: 'critical' | 'warning' | 'suggestion';
  type: 'font' | 'structure' | 'content' | 'format' | 'keywords';
  message: string;
  impact: 'high' | 'medium' | 'low';
  solution: string;
  location?: string;
}

export interface JobscanIntegration {
  enabled: boolean;
  apiKey?: string;
  baseUrl: string;
}

export interface CopyPasteTestResult {
  success: boolean;
  extractedText: string;
  originalLength: number;
  extractedLength: number;
  extractionRate: number;
  issues: string[];
  recommendations: string[];
}

/**
 * ATS Validator class for comprehensive compliance checking
 */
export class ATSValidator {
  private jobscanConfig: JobscanIntegration;

  constructor(jobscanConfig?: JobscanIntegration) {
    this.jobscanConfig = jobscanConfig || {
      enabled: false,
      baseUrl: 'https://api.jobscan.co/v1' // Placeholder - actual API would need configuration
    };
  }

  /**
   * Perform comprehensive ATS validation on a document
   * @param documentBuffer - Document buffer (PDF or DOCX)
   * @param format - Document format
   * @param profile - User profile for content validation
   * @param tailoredContent - Tailored content for keyword analysis
   * @returns Complete ATS score and validation results
   */
  async validateDocument(
    documentBuffer: Buffer,
    format: 'pdf' | 'docx',
    profile: UserProfile,
    tailoredContent: TailoredContent
  ): Promise<ATSScore> {
    const issues: ATSValidationIssue[] = [];
    const recommendations: string[] = [];

    try {
      // 1. Text Extraction Validation
      const textResult = await TextExtractor.performCopyPasteTest(
        documentBuffer,
        format,
        this.generateExpectedContent(profile, tailoredContent)
      );
      
      const textScore = this.calculateTextExtractionScore(textResult, issues, recommendations);

      // 2. Font Compliance Validation
      const fontResult = await this.validateFontCompliance(documentBuffer, format);
      const fontScore = this.calculateFontComplianceScore(fontResult, issues, recommendations);

      // 3. Structure Compliance Validation
      const structureScore = await this.validateDocumentStructure(
        textResult.extractedText, 
        profile, 
        issues, 
        recommendations
      );

      // 4. Keyword Optimization Validation
      const keywordScore = this.validateKeywordOptimization(
        textResult.extractedText,
        tailoredContent,
        issues,
        recommendations
      );

      // 5. Format-Specific Compliance
      const formatScore = this.validateFormatCompliance(format, documentBuffer, issues, recommendations);

      // 6. External Scoring (Jobscan integration if available)
      let externalScore = null;
      if (this.jobscanConfig.enabled && this.jobscanConfig.apiKey) {
        try {
          externalScore = await this.getJobscanScore(documentBuffer, format);
        } catch (error) {
          console.warn('Jobscan integration failed:', error);
          recommendations.push('Consider manual ATS testing with Jobscan or similar tools');
        }
      }

      // Calculate overall score
      const breakdown = {
        textExtraction: textScore,
        fontCompliance: fontScore,
        structureCompliance: structureScore,
        keywordOptimization: keywordScore,
        formatCompliance: formatScore
      };

      const overall = this.calculateOverallScore(breakdown, externalScore);

      // Add overall recommendations
      this.addOverallRecommendations(overall, breakdown, recommendations);

      return {
        overall,
        breakdown,
        recommendations,
        issues,
        timestamp: new Date()
      };

    } catch (error) {
      // Fallback scoring in case of validation errors
      issues.push({
        category: 'critical',
        type: 'format',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        impact: 'high',
        solution: 'Ensure document is properly formatted and uses standard fonts'
      });

      return {
        overall: 0,
        breakdown: {
          textExtraction: 0,
          fontCompliance: 0,
          structureCompliance: 0,
          keywordOptimization: 0,
          formatCompliance: 0
        },
        recommendations: ['Document validation failed - please regenerate with ATS-compliant settings'],
        issues,
        timestamp: new Date()
      };
    }
  }

  /**
   * Perform copy-paste validation test
   * @param documentBuffer - Document buffer
   * @param format - Document format
   * @param expectedContent - Expected content for comparison
   * @returns Copy-paste test results
   */
  async performCopyPasteValidation(
    documentBuffer: Buffer,
    format: 'pdf' | 'docx',
    expectedContent: string
  ): Promise<CopyPasteTestResult> {
    try {
      const result = await TextExtractor.performCopyPasteTest(documentBuffer, format, expectedContent);
      
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Analyze extraction quality
      if (result.extractionRate < 0.85) {
        issues.push(`Low text extraction rate: ${Math.round(result.extractionRate * 100)}%`);
        recommendations.push('Use standard PDF fonts (Helvetica, Times-Roman, Courier) for better ATS compatibility');
      }

      // Check for garbled text issues from the TextExtractor result
      const garbledTextIssues = result.issues.filter(issue => issue.type === 'garbled_text');
      if (garbledTextIssues.length > 0) {
        garbledTextIssues.forEach(issue => {
          issues.push(issue.message);
        });
        recommendations.push('Avoid embedded fonts and use standard system fonts');
      }

      if (result.extractedText.length < expectedContent.length * 0.8) {
        issues.push('Significant content missing from extraction');
        recommendations.push('Ensure all text uses readable fonts and proper encoding');
      }

      return {
        success: result.success && result.extractionRate >= 0.85,
        extractedText: result.extractedText,
        originalLength: expectedContent.length,
        extractedLength: result.extractedText.length,
        extractionRate: result.extractionRate,
        issues,
        recommendations
      };

    } catch (error) {
      return {
        success: false,
        extractedText: '',
        originalLength: expectedContent.length,
        extractedLength: 0,
        extractionRate: 0,
        issues: [`Copy-paste test failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: ['Regenerate document with ATS-compliant settings']
      };
    }
  }

  /**
   * Generate comprehensive ATS compliance report
   * @param score - ATS score results
   * @returns Formatted compliance report
   */
  generateComplianceReport(score: ATSScore): string {
    const lines: string[] = [];
    
    lines.push('=== ATS COMPLIANCE REPORT ===');
    lines.push(`Generated: ${score.timestamp.toISOString()}`);
    lines.push(`Overall Score: ${score.overall}/100`);
    lines.push('');

    // Score breakdown
    lines.push('SCORE BREAKDOWN:');
    lines.push(`• Text Extraction: ${score.breakdown.textExtraction}/100`);
    lines.push(`• Font Compliance: ${score.breakdown.fontCompliance}/100`);
    lines.push(`• Structure Compliance: ${score.breakdown.structureCompliance}/100`);
    lines.push(`• Keyword Optimization: ${score.breakdown.keywordOptimization}/100`);
    lines.push(`• Format Compliance: ${score.breakdown.formatCompliance}/100`);
    lines.push('');

    // Overall assessment
    if (score.overall >= 85) {
      lines.push('✅ EXCELLENT ATS COMPATIBILITY');
      lines.push('Your resume is highly optimized for ATS systems.');
    } else if (score.overall >= 70) {
      lines.push('⚠️ GOOD ATS COMPATIBILITY');
      lines.push('Your resume should work well with most ATS systems.');
    } else if (score.overall >= 50) {
      lines.push('⚠️ MODERATE ATS COMPATIBILITY');
      lines.push('Some improvements needed for optimal ATS performance.');
    } else {
      lines.push('❌ POOR ATS COMPATIBILITY');
      lines.push('Significant improvements required for ATS systems.');
    }
    lines.push('');

    // Issues
    if (score.issues.length > 0) {
      lines.push('ISSUES FOUND:');
      score.issues.forEach((issue, index) => {
        const icon = issue.category === 'critical' ? '❌' : issue.category === 'warning' ? '⚠️' : 'ℹ️';
        lines.push(`${icon} ${issue.message}`);
        lines.push(`   Impact: ${issue.impact.toUpperCase()}`);
        lines.push(`   Solution: ${issue.solution}`);
        if (issue.location) {
          lines.push(`   Location: ${issue.location}`);
        }
        lines.push('');
      });
    }

    // Recommendations
    if (score.recommendations.length > 0) {
      lines.push('RECOMMENDATIONS:');
      score.recommendations.forEach((rec, index) => {
        lines.push(`${index + 1}. ${rec}`);
      });
      lines.push('');
    }

    lines.push('=== END REPORT ===');
    
    return lines.join('\n');
  }

  // Private helper methods

  private generateExpectedContent(profile: UserProfile, tailoredContent: TailoredContent): string {
    return [
      profile.header.name,
      profile.header.title,
      profile.header.email,
      tailoredContent.summary,
      ...profile.experience.flatMap(exp => [
        exp.jobTitle,
        exp.company,
        ...exp.bullets.map(bullet => `${bullet.categoryLabel} ${bullet.description}`)
      ]),
      ...profile.education.map(edu => `${edu.degree} ${edu.field} ${edu.institution}`),
      ...tailoredContent.reorderedSkills.flatMap(cat => 
        [cat.name, ...cat.skills.map(skill => skill.name)]
      ),
      ...profile.languages.map(lang => `${lang.name} ${lang.proficiency}`)
    ].join(' ');
  }

  private calculateTextExtractionScore(
    result: TextExtractionResult, 
    issues: ATSValidationIssue[], 
    recommendations: string[]
  ): number {
    let score = 100;

    if (result.extractionRate < 0.95) {
      const deduction = Math.round((0.95 - result.extractionRate) * 100);
      score -= deduction;
      
      if (result.extractionRate < 0.85) {
        // Ensure score is below 85 when extraction rate is below 0.85
        score = Math.min(score, 84);
        issues.push({
          category: 'critical',
          type: 'content',
          message: `Low text extraction rate: ${Math.round(result.extractionRate * 100)}%`,
          impact: 'high',
          solution: 'Use standard PDF fonts and avoid embedded fonts'
        });
      }
    }

    if (result.issues.some(issue => issue.type === 'garbled_text')) {
      score -= 30;
      issues.push({
        category: 'critical',
        type: 'font',
        message: 'Garbled text detected',
        impact: 'high',
        solution: 'Replace custom fonts with Helvetica, Times-Roman, or Courier'
      });
    }

    if (score < 85) {
      recommendations.push('Improve text extraction by using standard fonts and proper document structure');
    }

    return Math.max(0, score);
  }

  private async validateFontCompliance(documentBuffer: Buffer, format: string): Promise<ValidationResult> {
    // For now, return a mock validation result
    // In a real implementation, this would analyze the document's font usage
    return {
      isCompliant: true,
      issues: [],
      timestamp: new Date(),
      score: 100
    };
  }

  private calculateFontComplianceScore(
    result: ValidationResult, 
    issues: ATSValidationIssue[], 
    recommendations: string[]
  ): number {
    if (!result.isCompliant) {
      result.issues.forEach(issue => {
        issues.push({
          category: issue.severity === 'error' ? 'critical' : 'warning',
          type: 'font',
          message: issue.message,
          impact: issue.severity === 'error' ? 'high' : 'medium',
          solution: issue.recommendation
        });
      });
    }

    if (result.score < 85) {
      recommendations.push('Use only standard PDF fonts (Helvetica, Times-Roman, Courier) for maximum ATS compatibility');
    }

    return result.score;
  }

  private async validateDocumentStructure(
    extractedText: string, 
    profile: UserProfile, 
    issues: ATSValidationIssue[], 
    recommendations: string[]
  ): Promise<number> {
    let score = 100;

    // Check for required sections
    const requiredSections = ['experience', 'education', 'skills'];
    const textLower = extractedText.toLowerCase();

    requiredSections.forEach(section => {
      if (!textLower.includes(section)) {
        score -= 15;
        issues.push({
          category: 'warning',
          type: 'structure',
          message: `Missing ${section} section header`,
          impact: 'medium',
          solution: `Add clear "${section.toUpperCase()}" section header`
        });
      }
    });

    // Check for proper contact information
    if (!extractedText.includes(profile.header.email)) {
      score -= 10;
      issues.push({
        category: 'warning',
        type: 'content',
        message: 'Email address not found in extracted text',
        impact: 'medium',
        solution: 'Ensure contact information is clearly visible and uses standard fonts'
      });
    }

    if (score < 85) {
      recommendations.push('Improve document structure with clear section headers and proper contact information');
    }

    return Math.max(0, score);
  }

  private validateKeywordOptimization(
    extractedText: string,
    tailoredContent: TailoredContent,
    issues: ATSValidationIssue[],
    recommendations: string[]
  ): number {
    // Use the match score from tailored content as a baseline
    let score = tailoredContent.matchScore;

    if (score < 70) {
      issues.push({
        category: 'warning',
        type: 'keywords',
        message: `Low keyword match score: ${score}%`,
        impact: 'medium',
        solution: 'Include more relevant keywords from the job description'
      });
    }

    if (score < 85) {
      recommendations.push('Optimize keyword usage by incorporating more job-relevant terms');
    }

    return score;
  }

  private validateFormatCompliance(
    format: string,
    documentBuffer: Buffer,
    issues: ATSValidationIssue[],
    recommendations: string[]
  ): number {
    let score = 100;

    // Basic format validation
    if (documentBuffer.length === 0) {
      score = 0;
      issues.push({
        category: 'critical',
        type: 'format',
        message: 'Empty document buffer',
        impact: 'high',
        solution: 'Regenerate the document'
      });
    }

    // Format-specific checks
    if (format === 'pdf') {
      // PDF should start with %PDF
      const header = documentBuffer.slice(0, 4).toString();
      if (header !== '%PDF') {
        score -= 20;
        issues.push({
          category: 'warning',
          type: 'format',
          message: 'Invalid PDF header',
          impact: 'medium',
          solution: 'Ensure PDF is properly generated'
        });
      }
    } else if (format === 'docx') {
      // DOCX should be a valid ZIP file (starts with PK)
      const header = documentBuffer.slice(0, 2).toString();
      if (header !== 'PK') {
        score -= 20;
        issues.push({
          category: 'warning',
          type: 'format',
          message: 'Invalid DOCX format',
          impact: 'medium',
          solution: 'Ensure DOCX is properly generated'
        });
      }
    }

    return Math.max(0, score);
  }

  private calculateOverallScore(
    breakdown: ATSScore['breakdown'],
    externalScore: number | null
  ): number {
    // Weighted average of all components
    const weights = {
      textExtraction: 0.3,    // 30% - most critical for ATS
      fontCompliance: 0.25,   // 25% - very important for parsing
      structureCompliance: 0.2, // 20% - important for readability
      keywordOptimization: 0.15, // 15% - important for matching
      formatCompliance: 0.1   // 10% - basic requirement
    };

    let weightedScore = 
      breakdown.textExtraction * weights.textExtraction +
      breakdown.fontCompliance * weights.fontCompliance +
      breakdown.structureCompliance * weights.structureCompliance +
      breakdown.keywordOptimization * weights.keywordOptimization +
      breakdown.formatCompliance * weights.formatCompliance;

    // If external score is available, blend it in
    if (externalScore !== null) {
      weightedScore = (weightedScore * 0.7) + (externalScore * 0.3);
    }

    return Math.round(Math.max(0, Math.min(100, weightedScore)));
  }

  private addOverallRecommendations(
    overall: number,
    breakdown: ATSScore['breakdown'],
    recommendations: string[]
  ): void {
    if (overall < 85) {
      recommendations.push('Consider regenerating with ATS-optimized settings');
    }

    // Find the lowest scoring component and add specific recommendation
    const scores = Object.entries(breakdown);
    const lowest = scores.reduce((min, current) => 
      current[1] < min[1] ? current : min
    );

    if (lowest[1] < 70) {
      switch (lowest[0]) {
        case 'textExtraction':
          recommendations.push('Priority: Fix text extraction issues by using standard fonts');
          break;
        case 'fontCompliance':
          recommendations.push('Priority: Replace custom fonts with ATS-compatible standard fonts');
          break;
        case 'structureCompliance':
          recommendations.push('Priority: Improve document structure with clear section headers');
          break;
        case 'keywordOptimization':
          recommendations.push('Priority: Add more relevant keywords from the job description');
          break;
        case 'formatCompliance':
          recommendations.push('Priority: Ensure document format is properly generated');
          break;
      }
    }
  }

  private async getJobscanScore(documentBuffer: Buffer, format: string): Promise<number | null> {
    // Placeholder for Jobscan API integration
    // In a real implementation, this would call the Jobscan API
    console.log('Jobscan integration not implemented - would analyze document for ATS score');
    return null;
  }
}