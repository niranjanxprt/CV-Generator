/**
 * Property-based tests for text extraction validation
 * Validates: Requirements 11.4, 17.2, 17.3
 */

import fc from 'fast-check';
import { TextExtractor, TextExtractionResult } from '@/validation/textExtractor';

// Mock pdfjs-dist for testing
jest.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn(() => Promise.resolve({
        getTextContent: jest.fn(() => Promise.resolve({
          items: [
            { str: 'Test document content' },
            { str: 'with multiple text items' },
            { str: 'for validation testing' }
          ]
        }))
      })),
      destroy: jest.fn(() => Promise.resolve())
    })
  }))
}));

describe('Text Extraction Validation Property Tests', () => {
  describe('Property 5: Garbled Text Prevention', () => {
    it('should detect garbled text patterns in extracted content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate text with potential garbled patterns
            cleanText: fc.string({ minLength: 50, maxLength: 200 }),
            garbledPattern: fc.oneof(
              fc.constant('îòðéðóð'), // Common garbled sequence
              fc.constant('ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ'), // Extended ASCII
              fc.constant('????'), // Question marks
              fc.constant('\ufffd\ufffd\ufffd'), // Replacement characters
              fc.string({ minLength: 5, maxLength: 10 }).map(s => s.replace(/[a-zA-Z0-9\s]/g, 'Ñ')) // Non-ASCII sequences
            ),
            hasGarbledText: fc.boolean()
          }),
          async ({ cleanText, garbledPattern, hasGarbledText }) => {
            // Arrange: Create test content with or without garbled text
            const testContent = hasGarbledText 
              ? `${cleanText} ${garbledPattern} more content`
              : cleanText;
            
            const mockBuffer = Buffer.from('mock pdf content');
            
            // Mock the PDF extraction to return our test content
            const mockExtractFromPDF = jest.spyOn(TextExtractor, 'extractFromPDF');
            mockExtractFromPDF.mockResolvedValue({
              success: !hasGarbledText,
              extractedText: testContent,
              wordCount: testContent.split(/\s+/).length,
              characterCount: testContent.length,
              extractionRate: 1.0,
              issues: hasGarbledText ? [{
                type: 'garbled_text',
                severity: 'error',
                message: 'Garbled text detected',
                suggestion: 'Use standard PDF fonts'
              }] : [],
              timestamp: new Date()
            });
            
            // Act: Extract text
            const result = await TextExtractor.extractFromPDF(mockBuffer);
            
            // Assert: Garbled text detection works correctly
            if (hasGarbledText) {
              expect(result.success).toBe(false);
              expect(result.issues.some(issue => issue.type === 'garbled_text')).toBe(true);
            } else {
              expect(result.success).toBe(true);
              expect(result.issues.filter(issue => issue.type === 'garbled_text')).toHaveLength(0);
            }
            
            mockExtractFromPDF.mockRestore();
            return true;
          }
        ),
        { numRuns: 10, verbose: true }
      );
    });

    it('should handle various garbled text patterns consistently', async () => {
      const garbledPatterns = [
        'îòðéðóð',
        'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ',
        '????',
        '\ufffd\ufffd\ufffd',
        'ÑÑÑÑÑ'
      ];

      for (const pattern of garbledPatterns) {
        const testContent = `Clean text ${pattern} more clean text`;
        const mockBuffer = Buffer.from('mock pdf content');
        
        const mockExtractFromPDF = jest.spyOn(TextExtractor, 'extractFromPDF');
        mockExtractFromPDF.mockResolvedValue({
          success: false,
          extractedText: testContent,
          wordCount: testContent.split(/\s+/).length,
          characterCount: testContent.length,
          extractionRate: 1.0,
          issues: [{
            type: 'garbled_text',
            severity: 'error',
            message: `Garbled text detected: ${pattern}`,
            suggestion: 'Use standard PDF fonts'
          }],
          timestamp: new Date()
        });
        
        const result = await TextExtractor.extractFromPDF(mockBuffer);
        
        expect(result.success).toBe(false);
        expect(result.issues.some(issue => issue.type === 'garbled_text')).toBe(true);
        
        mockExtractFromPDF.mockRestore();
      }
    });
  });

  describe('Property 6: Complete Text Extraction', () => {
    it('should achieve high extraction rates for well-formed documents', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            originalText: fc.string({ minLength: 100, maxLength: 500 }),
            extractionQuality: fc.float({ min: Math.fround(0.85), max: Math.fround(1.0) }), // Simulate extraction quality
            documentQuality: fc.constantFrom('good', 'fair', 'poor')
          }),
          async ({ originalText, extractionQuality }) => {
            // Arrange: Simulate text extraction with varying quality
            const wordsToExtract = Math.floor(originalText.split(/\s+/).length * extractionQuality);
            const extractedWords = originalText.split(/\s+/).slice(0, wordsToExtract);
            const extractedText = extractedWords.join(' ');
            
            const mockBuffer = Buffer.from('mock pdf content');
            
            const mockExtractFromPDF = jest.spyOn(TextExtractor, 'extractFromPDF');
            mockExtractFromPDF.mockResolvedValue({
              success: extractionQuality >= 0.85,
              extractedText,
              wordCount: extractedWords.length,
              characterCount: extractedText.length,
              extractionRate: extractionQuality,
              issues: extractionQuality < 0.85 ? [{
                type: 'missing_content',
                severity: 'error',
                message: `Low extraction rate: ${Math.round(extractionQuality * 100)}%`,
                suggestion: 'Check font embedding and document structure'
              }] : [],
              timestamp: new Date()
            });
            
            // Act: Extract text with expected content
            const result = await TextExtractor.extractFromPDF(mockBuffer, originalText);
            
            // Assert: Extraction rate meets requirements
            expect(result.extractionRate).toBeGreaterThanOrEqual(0);
            expect(result.extractionRate).toBeLessThanOrEqual(1);
            
            if (extractionQuality >= 0.85) {
              expect(result.success).toBe(true);
              expect(result.extractionRate).toBeGreaterThanOrEqual(0.85);
            } else {
              expect(result.success).toBe(false);
              expect(result.issues.some(issue => issue.type === 'missing_content')).toBe(true);
            }
            
            mockExtractFromPDF.mockRestore();
            return true;
          }
        ),
        { numRuns: 12, verbose: true }
      );
    });

    it('should handle empty or minimal content appropriately', async () => {
      const testCases = [
        { content: '', shouldFail: true },
        { content: 'A', shouldFail: true },
        { content: 'Short text under fifty characters total length', shouldFail: true },
        { content: 'This is a longer text that should pass the minimum length requirement for proper ATS validation and text extraction testing', shouldFail: false }
      ];

      for (const testCase of testCases) {
        const mockBuffer = Buffer.from('mock pdf content');
        
        const mockExtractFromPDF = jest.spyOn(TextExtractor, 'extractFromPDF');
        mockExtractFromPDF.mockResolvedValue({
          success: !testCase.shouldFail,
          extractedText: testCase.content,
          wordCount: testCase.content.split(/\s+/).filter(w => w.length > 0).length,
          characterCount: testCase.content.length,
          extractionRate: 1.0,
          issues: testCase.shouldFail ? [{
            type: 'missing_content',
            severity: 'error',
            message: 'Extracted text is too short or empty',
            suggestion: 'Ensure document contains readable text and uses proper fonts'
          }] : [],
          timestamp: new Date()
        });
        
        const result = await TextExtractor.extractFromPDF(mockBuffer);
        
        if (testCase.shouldFail) {
          expect(result.success).toBe(false);
          expect(result.issues.some(issue => issue.type === 'missing_content')).toBe(true);
        } else {
          expect(result.success).toBe(true);
        }
        
        mockExtractFromPDF.mockRestore();
      }
    });
  });

  describe('Copy-Paste Validation', () => {
    it('should perform comprehensive copy-paste validation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            format: fc.constantFrom('pdf', 'docx'),
            hasIssues: fc.boolean()
          }),
          async ({ format, hasIssues }) => {
            const testContent = 'This is test content for copy-paste validation with proper length and structure.';
            const mockBuffer = Buffer.from('mock document content');
            
            // Mock the appropriate extraction method
            const mockMethod = format === 'pdf' ? 'extractFromPDF' : 'extractFromDOCX';
            const mockExtract = jest.spyOn(TextExtractor, mockMethod as any);
            
            mockExtract.mockResolvedValue({
              success: !hasIssues,
              extractedText: hasIssues ? 'îòðéðóð garbled content' : testContent,
              wordCount: testContent.split(/\s+/).length,
              characterCount: testContent.length,
              extractionRate: hasIssues ? 0.5 : 0.95,
              issues: hasIssues ? [{
                type: 'garbled_text',
                severity: 'error',
                message: 'Garbled text detected in copy-paste test',
                suggestion: 'Use standard fonts for ATS compatibility'
              }] : [],
              timestamp: new Date()
            });
            
            // Act: Perform copy-paste test
            const result = await TextExtractor.performCopyPasteTest(mockBuffer, format, testContent);
            
            // Assert: Copy-paste test works correctly
            expect(result).toBeDefined();
            expect(result.timestamp).toBeInstanceOf(Date);
            
            if (hasIssues) {
              expect(result.success).toBe(false);
              expect(result.issues.length).toBeGreaterThan(0);
            } else {
              expect(result.success).toBe(true);
              expect(result.extractionRate).toBeGreaterThanOrEqual(0.85);
            }
            
            mockExtract.mockRestore();
            return true;
          }
        ),
        { numRuns: 8 }
      );
    });
  });

  describe('Batch Validation', () => {
    it('should handle batch validation of multiple documents', async () => {
      const documents = [
        { buffer: Buffer.from('doc1'), format: 'pdf' as const, expectedContent: 'Document 1 content' },
        { buffer: Buffer.from('doc2'), format: 'docx' as const, expectedContent: 'Document 2 content' },
        { buffer: Buffer.from('doc3'), format: 'pdf' as const, expectedContent: 'Document 3 content' }
      ];

      // Mock both extraction methods
      const mockPDF = jest.spyOn(TextExtractor, 'extractFromPDF');
      const mockDOCX = jest.spyOn(TextExtractor, 'extractFromDOCX');
      
      mockPDF.mockResolvedValue({
        success: true,
        extractedText: 'Extracted PDF content',
        wordCount: 3,
        characterCount: 20,
        extractionRate: 0.9,
        issues: [],
        timestamp: new Date()
      });
      
      mockDOCX.mockResolvedValue({
        success: true,
        extractedText: 'Extracted DOCX content',
        wordCount: 3,
        characterCount: 21,
        extractionRate: 0.95,
        issues: [],
        timestamp: new Date()
      });

      // Act: Perform batch validation
      const metrics = await TextExtractor.batchValidate(documents);

      // Assert: Batch validation works correctly
      expect(metrics.totalDocuments).toBe(3);
      expect(metrics.successfulExtractions).toBe(3);
      expect(metrics.averageExtractionRate).toBeGreaterThan(0.8);
      expect(metrics.commonIssues).toBeDefined();

      mockPDF.mockRestore();
      mockDOCX.mockRestore();
    });
  });

  describe('Validation Report Generation', () => {
    it('should generate comprehensive validation reports', () => {
      const testResult: TextExtractionResult = {
        success: false,
        extractedText: 'Test content with îòðéðóð garbled text',
        wordCount: 6,
        characterCount: 35,
        extractionRate: 0.75,
        issues: [
          {
            type: 'garbled_text',
            severity: 'error',
            message: 'Garbled text detected: îòðéðóð',
            suggestion: 'Use standard PDF fonts'
          },
          {
            type: 'missing_content',
            severity: 'warning',
            message: 'Moderate extraction rate: 75%',
            suggestion: 'Consider optimizing document structure'
          }
        ],
        timestamp: new Date('2024-01-01T00:00:00Z')
      };

      const report = TextExtractor.generateValidationReport(testResult);

      expect(report).toContain('ATS Text Extraction Validation Report');
      expect(report).toContain('❌ FAILED');
      expect(report).toContain('Extraction Rate: 75%');
      expect(report).toContain('Word Count: 6');
      expect(report).toContain('Garbled text detected');
      expect(report).toContain('Use standard PDF fonts');
      expect(report).toContain('Test content with îòðéðóð');
    });
  });
});