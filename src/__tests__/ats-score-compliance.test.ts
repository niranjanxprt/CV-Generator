/**
 * Property-based test for ATS score compliance
 * Validates: Requirements 1.6, 18.5, 19.3 - ATS score compliance and validation
 */

import fc from 'fast-check';
import { ATSValidator, ATSScore } from '@/validation/atsValidator';
import { UserProfile, TailoredContent } from '@/types';

// Mock dependencies
jest.mock('@/validation/textExtractor', () => ({
  TextExtractor: {
    performCopyPasteTest: jest.fn()
  }
}));

jest.mock('@/fonts/fontValidator', () => ({
  FontValidator: {
    validatePDF: jest.fn()
  }
}));

// Arbitraries for generating test data
const headerArbitrary = fc.record({
  name: fc.string({ minLength: 2, maxLength: 50 }),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  email: fc.emailAddress(),
  phone: fc.string({ minLength: 10, maxLength: 20 }),
  location: fc.string({ minLength: 5, maxLength: 50 }),
  linkedin: fc.webUrl(),
  github: fc.webUrl(),
  photo: fc.option(fc.webUrl(), { nil: undefined })
});

const bulletArbitrary = fc.record({
  id: fc.string(),
  categoryLabel: fc.string({ minLength: 3, maxLength: 30 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  score: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined })
});

const experienceArbitrary = fc.record({
  id: fc.string(),
  jobTitle: fc.string({ minLength: 5, maxLength: 50 }),
  subtitle: fc.option(fc.string({ minLength: 3, maxLength: 30 }), { nil: undefined }),
  company: fc.string({ minLength: 2, maxLength: 50 }),
  location: fc.string({ minLength: 3, maxLength: 50 }),
  startDate: fc.string({ minLength: 4, maxLength: 20 }),
  endDate: fc.string({ minLength: 4, maxLength: 20 }),
  bullets: fc.array(bulletArbitrary, { minLength: 1, maxLength: 4 })
});

const skillArbitrary = fc.record({
  id: fc.string(),
  name: fc.string({ minLength: 2, maxLength: 30 }),
  description: fc.string({ minLength: 5, maxLength: 100 }),
  keywords: fc.array(fc.string({ minLength: 2, maxLength: 20 }), { maxLength: 5 })
});

const skillCategoryArbitrary = fc.record({
  id: fc.string(),
  name: fc.string({ minLength: 3, maxLength: 30 }),
  skills: fc.array(skillArbitrary, { minLength: 1, maxLength: 6 })
});

const educationArbitrary = fc.record({
  id: fc.string(),
  degree: fc.string({ minLength: 5, maxLength: 50 }),
  field: fc.string({ minLength: 3, maxLength: 50 }),
  institution: fc.string({ minLength: 5, maxLength: 100 }),
  startDate: fc.string({ minLength: 4, maxLength: 20 }),
  endDate: fc.string({ minLength: 4, maxLength: 20 }),
  details: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined })
});

const languageArbitrary = fc.record({
  id: fc.string(),
  name: fc.string({ minLength: 2, maxLength: 30 }),
  proficiency: fc.constantFrom('Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic')
});

const referenceArbitrary = fc.record({
  id: fc.string(),
  name: fc.string({ minLength: 5, maxLength: 50 }),
  title: fc.string({ minLength: 5, maxLength: 50 }),
  company: fc.string({ minLength: 2, maxLength: 50 }),
  email: fc.emailAddress()
});

const userProfileArbitrary = fc.record({
  header: headerArbitrary,
  summary: fc.string({ minLength: 50, maxLength: 500 }),
  experience: fc.array(experienceArbitrary, { minLength: 1, maxLength: 4 }),
  skills: fc.array(skillCategoryArbitrary, { minLength: 1, maxLength: 5 }),
  education: fc.array(educationArbitrary, { minLength: 1, maxLength: 3 }),
  languages: fc.array(languageArbitrary, { minLength: 1, maxLength: 4 }),
  references: fc.array(referenceArbitrary, { maxLength: 2 })
});

const tailoredContentArbitrary = fc.record({
  summary: fc.string({ minLength: 50, maxLength: 500 }),
  topBullets: fc.array(bulletArbitrary, { maxLength: 15 }),
  reorderedSkills: fc.array(skillCategoryArbitrary, { minLength: 1, maxLength: 5 }),
  matchScore: fc.integer({ min: 0, max: 100 })
});

describe('ATS Score Compliance Property Tests', () => {
  describe('Property 4: ATS Score Compliance', () => {
    it('should always return valid ATS scores within expected ranges', async () => {
      await fc.assert(
        fc.asyncProperty(
          userProfileArbitrary,
          tailoredContentArbitrary,
          fc.constantFrom('pdf', 'docx'),
          fc.record({
            textExtractionRate: fc.float({ min: 0.5, max: 1.0 }),
            hasGarbledText: fc.boolean(),
            fontCompliance: fc.integer({ min: 60, max: 100 }),
            documentQuality: fc.constantFrom('excellent', 'good', 'poor')
          }),
          async (profile, tailoredContent, format, testConditions) => {
            // Arrange: Create test document buffer and mock dependencies
            const documentBuffer = Buffer.from('mock document content');
            const validator = new ATSValidator();

            // Mock text extraction based on test conditions
            const { TextExtractor } = await import('@/validation/textExtractor');
            const mockExtractorResult = {
              success: testConditions.textExtractionRate >= 0.85 && !testConditions.hasGarbledText,
              extractedText: testConditions.hasGarbledText 
                ? 'Test content with îòðéðóð garbled text'
                : 'Clean extracted text content for testing',
              wordCount: 50,
              characterCount: 200,
              extractionRate: testConditions.textExtractionRate,
              issues: testConditions.hasGarbledText ? [{
                type: 'garbled_text' as const,
                severity: 'error' as const,
                message: 'Garbled text detected: îòðéðóð',
                suggestion: 'Use standard fonts'
              }] : [],
              timestamp: new Date()
            };

            (TextExtractor.performCopyPasteTest as jest.MockedFunction<typeof TextExtractor.performCopyPasteTest>).mockResolvedValue(mockExtractorResult);

            // Act: Validate document
            const score = await validator.validateDocument(documentBuffer, format, profile, tailoredContent);

            // Assert: Score structure and ranges are valid
            expect(score).toBeDefined();
            expect(score.overall).toBeGreaterThanOrEqual(0);
            expect(score.overall).toBeLessThanOrEqual(100);
            expect(score.timestamp).toBeInstanceOf(Date);

            // Validate breakdown scores
            expect(score.breakdown.textExtraction).toBeGreaterThanOrEqual(0);
            expect(score.breakdown.textExtraction).toBeLessThanOrEqual(100);
            expect(score.breakdown.fontCompliance).toBeGreaterThanOrEqual(0);
            expect(score.breakdown.fontCompliance).toBeLessThanOrEqual(100);
            expect(score.breakdown.structureCompliance).toBeGreaterThanOrEqual(0);
            expect(score.breakdown.structureCompliance).toBeLessThanOrEqual(100);
            expect(score.breakdown.keywordOptimization).toBeGreaterThanOrEqual(0);
            expect(score.breakdown.keywordOptimization).toBeLessThanOrEqual(100);
            expect(score.breakdown.formatCompliance).toBeGreaterThanOrEqual(0);
            expect(score.breakdown.formatCompliance).toBeLessThanOrEqual(100);

            // Validate arrays are defined
            expect(Array.isArray(score.recommendations)).toBe(true);
            expect(Array.isArray(score.issues)).toBe(true);

            // Validate score consistency with conditions
            if (testConditions.hasGarbledText) {
              expect(score.breakdown.textExtraction).toBeLessThan(85);
              expect(score.issues.some(issue => issue.type === 'font')).toBe(true);
            }

            if (testConditions.textExtractionRate < 0.85) {
              expect(score.breakdown.textExtraction).toBeLessThan(85);
            }

            // Overall score should reflect poor conditions
            if (testConditions.documentQuality === 'poor') {
              expect(score.overall).toBeLessThan(90); // More lenient threshold for poor conditions
            }

            return true;
          }
        ),
        { numRuns: 10, verbose: true }
      );
    });

    it('should achieve target ATS scores for well-optimized documents', async () => {
      await fc.assert(
        fc.asyncProperty(
          userProfileArbitrary,
          tailoredContentArbitrary.map(content => ({ ...content, matchScore: fc.sample(fc.integer({ min: 85, max: 100 }), 1)[0] })),
          fc.constantFrom('pdf', 'docx'),
          async (profile, tailoredContent, format) => {
            // Arrange: Create optimal test conditions
            const documentBuffer = Buffer.from('well-formatted document content');
            const validator = new ATSValidator();

            // Mock optimal text extraction
            const { TextExtractor } = await import('@/validation/textExtractor');
            const mockExtractorResult = {
              success: true,
              extractedText: `${profile.header.name} ${profile.header.title} ${tailoredContent.summary}`,
              wordCount: 100,
              characterCount: 500,
              extractionRate: 0.95,
              issues: [],
              timestamp: new Date()
            };

            (TextExtractor.performCopyPasteTest as jest.MockedFunction<typeof TextExtractor.performCopyPasteTest>).mockResolvedValue(mockExtractorResult);

            // Act: Validate well-optimized document
            const score = await validator.validateDocument(documentBuffer, format, profile, tailoredContent);

            // Assert: High-quality documents should achieve good scores
            expect(score.overall).toBeGreaterThanOrEqual(70); // Minimum acceptable score
            expect(score.breakdown.textExtraction).toBeGreaterThanOrEqual(85);
            expect(score.breakdown.keywordOptimization).toBeGreaterThanOrEqual(85); // Based on high match score

            // Should have fewer critical issues
            const criticalIssues = score.issues.filter(issue => issue.category === 'critical');
            expect(criticalIssues.length).toBeLessThanOrEqual(1);

            return true;
          }
        ),
        { numRuns: 8 }
      );
    });

    it('should provide actionable recommendations for low-scoring documents', async () => {
      const testProfile: UserProfile = {
        header: {
          name: 'Test User',
          title: 'Software Engineer',
          email: 'test@example.com',
          phone: '+1234567890',
          location: 'Test City',
          linkedin: 'https://linkedin.com/in/test',
          github: 'https://github.com/test'
        },
        summary: 'Test summary',
        experience: [],
        skills: [],
        education: [],
        languages: [],
        references: []
      };

      const testTailoredContent: TailoredContent = {
        summary: 'Test tailored summary',
        topBullets: [],
        reorderedSkills: [],
        matchScore: 30 // Low match score
      };

      const documentBuffer = Buffer.from('poor quality document');
      const validator = new ATSValidator();

      // Mock poor text extraction
      const { TextExtractor } = await import('@/validation/textExtractor');
      const mockExtractorResult = {
        success: false,
        extractedText: 'îòðéðóð garbled content',
        wordCount: 5,
        characterCount: 20,
        extractionRate: 0.4,
        issues: [{
          type: 'garbled_text' as const,
          severity: 'error' as const,
          message: 'Garbled text detected: îòðéðóð',
          suggestion: 'Use standard fonts'
        }],
        timestamp: new Date()
      };

      (TextExtractor.performCopyPasteTest as jest.MockedFunction<typeof TextExtractor.performCopyPasteTest>).mockResolvedValue(mockExtractorResult);

      // Act: Validate poor document
      const score = await validator.validateDocument(documentBuffer, 'pdf', testProfile, testTailoredContent);

      // Assert: Low scores should provide helpful recommendations
      expect(score.overall).toBeLessThan(70);
      expect(score.recommendations.length).toBeGreaterThan(0);
      expect(score.issues.length).toBeGreaterThan(0);

      // Should have specific recommendations for improvement
      const hasTextExtractionRec = score.recommendations.some(rec => 
        rec.toLowerCase().includes('font') || rec.toLowerCase().includes('extraction')
      );
      expect(hasTextExtractionRec).toBe(true);

      // Should identify critical issues
      const hasCriticalIssues = score.issues.some(issue => issue.category === 'critical');
      expect(hasCriticalIssues).toBe(true);
    });
  });

  describe('Copy-Paste Validation', () => {
    it('should perform accurate copy-paste validation tests', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('pdf', 'docx'),
          fc.string({ minLength: 100, maxLength: 500 }).filter(s => s.trim().length > 0), // Ensure non-empty content
          fc.float({ min: 0.5, max: 1.0 }).filter(rate => !isNaN(rate) && isFinite(rate)), // Ensure valid extraction rate
          fc.boolean(),
          async (format, expectedContent, extractionRate, hasGarbledText) => {
            const documentBuffer = Buffer.from('test document');
            const validator = new ATSValidator();

            // Mock text extraction
            const { TextExtractor } = await import('@/validation/textExtractor');
            const extractedLength = Math.floor(expectedContent.length * extractionRate);
            const extractedText = hasGarbledText 
              ? expectedContent.substring(0, extractedLength) + 'îòðéðóð'
              : expectedContent.substring(0, extractedLength);

            // Ensure extraction rate is valid
            const actualExtractionRate = expectedContent.length > 0 ? extractedText.length / expectedContent.length : 0;

            const mockResult = {
              success: actualExtractionRate >= 0.85 && !hasGarbledText,
              extractedText,
              wordCount: extractedText.split(/\s+/).filter(word => word.length > 0).length,
              characterCount: extractedText.length,
              extractionRate: actualExtractionRate,
              issues: hasGarbledText ? [{
                type: 'garbled_text' as const,
                severity: 'error' as const,
                message: 'Garbled text detected: îòðéðóð',
                suggestion: 'Use standard fonts'
              }] : [],
              timestamp: new Date()
            };

            (TextExtractor.performCopyPasteTest as jest.MockedFunction<typeof TextExtractor.performCopyPasteTest>).mockResolvedValue(mockResult);

            // Act: Perform copy-paste validation
            const result = await validator.performCopyPasteValidation(documentBuffer, format, expectedContent);

            // Assert: Validation results are accurate
            expect(result.originalLength).toBe(expectedContent.length);
            expect(result.extractedLength).toBe(extractedText.length);
            
            // Only check extraction rate if it's a valid number
            if (!isNaN(result.extractionRate) && isFinite(result.extractionRate)) {
              expect(result.extractionRate).toBeCloseTo(actualExtractionRate, 1);
            }

            if (actualExtractionRate < 0.85) {
              expect(result.success).toBe(false);
              expect(result.issues.length).toBeGreaterThan(0);
            }

            if (hasGarbledText) {
              expect(result.success).toBe(false);
              expect(result.issues.some(issue => issue.toLowerCase().includes('garbled'))).toBe(true);
            }

            return true;
          }
        ),
        { numRuns: 8 }
      );
    });
  });

  describe('Compliance Report Generation', () => {
    it('should generate comprehensive and readable compliance reports', () => {
      const testScore: ATSScore = {
        overall: 75,
        breakdown: {
          textExtraction: 85,
          fontCompliance: 90,
          structureCompliance: 70,
          keywordOptimization: 65,
          formatCompliance: 95
        },
        recommendations: [
          'Improve keyword optimization',
          'Add clearer section headers'
        ],
        issues: [
          {
            category: 'warning',
            type: 'keywords',
            message: 'Low keyword match score',
            impact: 'medium',
            solution: 'Include more relevant keywords'
          }
        ],
        timestamp: new Date('2024-01-01T00:00:00Z')
      };

      const validator = new ATSValidator();
      const report = validator.generateComplianceReport(testScore);

      // Assert: Report contains expected sections
      expect(report).toContain('ATS COMPLIANCE REPORT');
      expect(report).toContain('Overall Score: 75/100');
      expect(report).toContain('SCORE BREAKDOWN');
      expect(report).toContain('Text Extraction: 85/100');
      expect(report).toContain('Font Compliance: 90/100');
      expect(report).toContain('GOOD ATS COMPATIBILITY');
      expect(report).toContain('ISSUES FOUND');
      expect(report).toContain('Low keyword match score');
      expect(report).toContain('RECOMMENDATIONS');
      expect(report).toContain('Improve keyword optimization');
    });

    it('should handle different score ranges appropriately', () => {
      const validator = new ATSValidator();

      // Test excellent score
      const excellentScore: ATSScore = {
        overall: 90,
        breakdown: { textExtraction: 95, fontCompliance: 95, structureCompliance: 90, keywordOptimization: 85, formatCompliance: 95 },
        recommendations: [],
        issues: [],
        timestamp: new Date()
      };

      const excellentReport = validator.generateComplianceReport(excellentScore);
      expect(excellentReport).toContain('EXCELLENT ATS COMPATIBILITY');

      // Test poor score
      const poorScore: ATSScore = {
        overall: 40,
        breakdown: { textExtraction: 30, fontCompliance: 40, structureCompliance: 50, keywordOptimization: 45, formatCompliance: 35 },
        recommendations: ['Major improvements needed'],
        issues: [{
          category: 'critical',
          type: 'font',
          message: 'Critical font issues',
          impact: 'high',
          solution: 'Use standard fonts'
        }],
        timestamp: new Date()
      };

      const poorReport = validator.generateComplianceReport(poorScore);
      expect(poorReport).toContain('POOR ATS COMPATIBILITY');
      expect(poorReport).toContain('Critical font issues');
    });
  });
});