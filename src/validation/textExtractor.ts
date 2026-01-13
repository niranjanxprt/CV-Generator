/**
 * Text Extraction Validation System for ATS Compliance
 * 
 * This module provides comprehensive text extraction and validation
 * functionality to ensure generated documents are ATS-compatible.
 * 
 * Requirements: 17.1, 17.3, 17.4, 11.4, 17.2
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
} else {
  // Node.js environment
  pdfjsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.js');
}

export interface TextExtractionResult {
  success: boolean;
  extractedText: string;
  wordCount: number;
  characterCount: number;
  extractionRate: number; // Percentage of expected text extracted
  issues: TextExtractionIssue[];
  timestamp: Date;
}

export interface TextExtractionIssue {
  type: 'garbled_text' | 'missing_content' | 'encoding_error' | 'structure_error';
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: string;
  suggestion: string;
}

export interface ValidationMetrics {
  totalDocuments: number;
  successfulExtractions: number;
  averageExtractionRate: number;
  commonIssues: Record<string, number>;
}

/**
 * Text Extractor class for comprehensive document validation
 */
export class TextExtractor {
  private static readonly GARBLED_PATTERNS = [
    /[îòðéðóð]+/g, // Common garbled characters
    /[\u00C0-\u00FF]{3,}/g, // Extended ASCII sequences
    /[^\x00-\x7F\s]{5,}/g, // Non-ASCII sequences
    /\?{3,}/g, // Question mark sequences
    /\ufffd+/g, // Replacement characters
    /[\u0080-\u00FF]{4,}/g, // High-bit characters
  ];

  private static readonly MIN_EXTRACTION_RATE = 0.85; // 85% minimum extraction rate

  /**
   * Extract text from PDF buffer
   * @param pdfBuffer - PDF file as Buffer
   * @param expectedContent - Expected content for validation (optional)
   * @returns TextExtractionResult
   */
  static async extractFromPDF(
    pdfBuffer: Buffer, 
    expectedContent?: string
  ): Promise<TextExtractionResult> {
    const issues: TextExtractionIssue[] = [];
    let extractedText = '';
    
    try {
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(pdfBuffer),
        verbosity: 0 // Suppress warnings
      });
      
      const pdf = await loadingTask.promise;
      const textParts: string[] = [];
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine text items
          const pageText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ');
          
          textParts.push(pageText);
        } catch (pageError) {
          issues.push({
            type: 'structure_error',
            severity: 'error',
            message: `Failed to extract text from page ${pageNum}`,
            location: `Page ${pageNum}`,
            suggestion: 'Check PDF structure and font embedding'
          });
        }
      }
      
      extractedText = textParts.join('\n').trim();
      
      // Clean up the PDF document
      await pdf.destroy();
      
    } catch (error) {
      issues.push({
        type: 'encoding_error',
        severity: 'error',
        message: `PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Ensure PDF uses standard fonts and proper encoding'
      });
    }
    
    // Validate extracted text
    const validationIssues = this.validateExtractedText(extractedText, expectedContent);
    issues.push(...validationIssues);
    
    // Calculate metrics
    const wordCount = extractedText.split(/\s+/).filter((word: string) => word.length > 0).length;
    const characterCount = extractedText.length;
    const extractionRate = expectedContent 
      ? this.calculateExtractionRate(extractedText, expectedContent)
      : 1.0;
    
    return {
      success: issues.filter(i => i.severity === 'error').length === 0,
      extractedText,
      wordCount,
      characterCount,
      extractionRate,
      issues,
      timestamp: new Date()
    };
  }

  /**
   * Extract text from DOCX buffer
   * @param docxBuffer - DOCX file as Buffer
   * @param expectedContent - Expected content for validation (optional)
   * @returns TextExtractionResult
   */
  static async extractFromDOCX(
    docxBuffer: Buffer, 
    expectedContent?: string
  ): Promise<TextExtractionResult> {
    const issues: TextExtractionIssue[] = [];
    
    try {
      // Check if buffer is valid
      if (!docxBuffer || docxBuffer.length === 0) {
        throw new Error('Empty or invalid DOCX buffer');
      }
      
      // Add TextDecoder polyfill for Node.js environment
      if (typeof global !== 'undefined' && !global.TextDecoder) {
        const { TextDecoder } = require('util');
        global.TextDecoder = TextDecoder;
      }
      
      // Use mammoth to extract text from DOCX
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer: docxBuffer });
      
      if (!result || typeof result.value !== 'string') {
        throw new Error('Mammoth returned invalid result');
      }
      
      const extractedText = result.value.trim();
      
      // Log any mammoth messages/warnings
      if (result.messages && result.messages.length > 0) {
        result.messages.forEach((msg: any) => {
          if (msg.type === 'warning') {
            issues.push({
              type: 'structure_error',
              severity: 'warning',
              message: `DOCX parsing warning: ${msg.message}`,
              suggestion: 'Check DOCX structure and formatting'
            });
          }
        });
      }
      
      // Validate extracted text
      const validationIssues = this.validateExtractedText(extractedText, expectedContent);
      issues.push(...validationIssues);
      
      const wordCount = extractedText.split(/\s+/).filter((word: string) => word.length > 0).length;
      const characterCount = extractedText.length;
      const extractionRate = expectedContent 
        ? this.calculateExtractionRate(extractedText, expectedContent)
        : 1.0;
      
      return {
        success: issues.filter(i => i.severity === 'error').length === 0,
        extractedText,
        wordCount,
        characterCount,
        extractionRate,
        issues,
        timestamp: new Date()
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      issues.push({
        type: 'encoding_error',
        severity: 'error',
        message: `DOCX parsing failed: ${errorMessage}`,
        suggestion: 'Ensure DOCX file is valid and not corrupted'
      });
      
      return {
        success: false,
        extractedText: '',
        wordCount: 0,
        characterCount: 0,
        extractionRate: 0,
        issues,
        timestamp: new Date()
      };
    }
  }

  /**
   * Validate extracted text for common ATS issues
   * @param extractedText - Text extracted from document
   * @param expectedContent - Expected content for comparison (optional)
   * @returns Array of validation issues
   */
  private static validateExtractedText(
    extractedText: string, 
    expectedContent?: string
  ): TextExtractionIssue[] {
    const issues: TextExtractionIssue[] = [];
    
    // Check for garbled text patterns
    for (const pattern of this.GARBLED_PATTERNS) {
      const matches = extractedText.match(pattern);
      if (matches && matches.length > 0) {
        issues.push({
          type: 'garbled_text',
          severity: 'error',
          message: `Garbled text detected: ${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''}`,
          suggestion: 'Use standard PDF fonts (Helvetica, Times-Roman, Courier) to prevent encoding issues'
        });
      }
    }
    
    // Check for empty or minimal content
    if (extractedText.trim().length < 50) {
      issues.push({
        type: 'missing_content',
        severity: 'error',
        message: 'Extracted text is too short or empty',
        suggestion: 'Ensure document contains readable text and uses proper fonts'
      });
    }
    
    // Check extraction rate if expected content is provided
    if (expectedContent) {
      const extractionRate = this.calculateExtractionRate(extractedText, expectedContent);
      
      if (extractionRate < this.MIN_EXTRACTION_RATE) {
        issues.push({
          type: 'missing_content',
          severity: 'error',
          message: `Low extraction rate: ${Math.round(extractionRate * 100)}% (minimum: ${Math.round(this.MIN_EXTRACTION_RATE * 100)}%)`,
          suggestion: 'Check font embedding and document structure'
        });
      } else if (extractionRate < 0.95) {
        issues.push({
          type: 'missing_content',
          severity: 'warning',
          message: `Moderate extraction rate: ${Math.round(extractionRate * 100)}%`,
          suggestion: 'Consider optimizing document structure for better text extraction'
        });
      }
    }
    
    // Check for common encoding issues
    if (extractedText.includes('\ufffd')) {
      issues.push({
        type: 'encoding_error',
        severity: 'error',
        message: 'Unicode replacement characters detected',
        suggestion: 'Use standard fonts and proper character encoding'
      });
    }
    
    return issues;
  }

  /**
   * Calculate extraction rate by comparing extracted text with expected content
   * @param extractedText - Text extracted from document
   * @param expectedContent - Expected content
   * @returns Extraction rate (0.0 to 1.0)
   */
  private static calculateExtractionRate(extractedText: string, expectedContent: string): number {
    if (!expectedContent || expectedContent.length === 0) return 1.0;
    
    // Normalize both texts for comparison
    const normalizeText = (text: string) => 
      text.toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s]/g, '')
          .trim();
    
    const normalizedExtracted = normalizeText(extractedText);
    const normalizedExpected = normalizeText(expectedContent);
    
    // Calculate word-level overlap
    const extractedWords = new Set(normalizedExtracted.split(/\s+/));
    const expectedWords = new Set(normalizedExpected.split(/\s+/));
    
    const intersection = new Set([...extractedWords].filter(word => expectedWords.has(word)));
    
    return expectedWords.size > 0 ? intersection.size / expectedWords.size : 0;
  }

  /**
   * Perform copy-paste validation test
   * @param documentBuffer - Document buffer (PDF or DOCX)
   * @param format - Document format ('pdf' or 'docx')
   * @param expectedContent - Expected content for validation
   * @returns TextExtractionResult
   */
  static async performCopyPasteTest(
    documentBuffer: Buffer,
    format: 'pdf' | 'docx',
    expectedContent: string
  ): Promise<TextExtractionResult> {
    if (format === 'pdf') {
      return this.extractFromPDF(documentBuffer, expectedContent);
    } else if (format === 'docx') {
      return this.extractFromDOCX(documentBuffer, expectedContent);
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate comprehensive validation report
   * @param result - Text extraction result
   * @returns Formatted report string
   */
  static generateValidationReport(result: TextExtractionResult): string {
    const lines: string[] = [];
    
    lines.push('=== ATS Text Extraction Validation Report ===');
    lines.push(`Generated: ${result.timestamp.toISOString()}`);
    lines.push(`Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`Extraction Rate: ${Math.round(result.extractionRate * 100)}%`);
    lines.push(`Word Count: ${result.wordCount}`);
    lines.push(`Character Count: ${result.characterCount}`);
    lines.push('');
    
    if (result.issues.length === 0) {
      lines.push('✅ No issues found - text extraction is fully ATS compliant');
    } else {
      lines.push('Issues found:');
      result.issues.forEach((issue) => {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        lines.push(`${icon} ${issue.message}`);
        if (issue.location) {
          lines.push(`   Location: ${issue.location}`);
        }
        lines.push(`   Suggestion: ${issue.suggestion}`);
        lines.push('');
      });
    }
    
    if (result.extractedText.length > 0) {
      lines.push('--- Extracted Text Preview (first 200 characters) ---');
      lines.push(result.extractedText.substring(0, 200) + (result.extractedText.length > 200 ? '...' : ''));
    }
    
    return lines.join('\n');
  }

  /**
   * Batch validate multiple documents
   * @param documents - Array of document buffers with metadata
   * @returns Validation metrics
   */
  static async batchValidate(
    documents: Array<{ buffer: Buffer; format: 'pdf' | 'docx'; expectedContent?: string }>
  ): Promise<ValidationMetrics> {
    const results: TextExtractionResult[] = [];
    
    for (const doc of documents) {
      try {
        const result = await this.performCopyPasteTest(doc.buffer, doc.format, doc.expectedContent || '');
        results.push(result);
      } catch (error) {
        // Add failed result
        results.push({
          success: false,
          extractedText: '',
          wordCount: 0,
          characterCount: 0,
          extractionRate: 0,
          issues: [{
            type: 'encoding_error',
            severity: 'error',
            message: `Batch validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            suggestion: 'Check document format and integrity'
          }],
          timestamp: new Date()
        });
      }
    }
    
    // Calculate metrics
    const successfulExtractions = results.filter(r => r.success).length;
    const averageExtractionRate = results.length > 0 
      ? results.reduce((sum, r) => sum + r.extractionRate, 0) / results.length
      : 0;
    
    // Count common issues
    const commonIssues: Record<string, number> = {};
    results.forEach(result => {
      result.issues.forEach(issue => {
        commonIssues[issue.type] = (commonIssues[issue.type] || 0) + 1;
      });
    });
    
    return {
      totalDocuments: documents.length,
      successfulExtractions,
      averageExtractionRate,
      commonIssues
    };
  }
}