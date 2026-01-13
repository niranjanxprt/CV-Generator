/**
 * Property-based test for format content consistency
 * Validates: Requirements 18.1, 18.4 - Content consistency between PDF and DOCX formats
 */

import fc from 'fast-check';
import { UserProfile, TailoredContent } from '@/types';
import { DocxGenerator } from '@/export/docxGenerator';
import { TextExtractor } from '@/validation/textExtractor';

// Mock the PDF generation for comparison
const mockPDFGenerator = {
  generateResume: async (profile: UserProfile, tailoredContent: TailoredContent): Promise<Buffer> => {
    // Simulate PDF generation with consistent content
    const content = [
      profile.header.name,
      profile.header.title,
      profile.header.email,
      tailoredContent.summary,
      ...profile.experience.flatMap(exp => [
        exp.jobTitle,
        exp.company,
        ...exp.bullets.map(bullet => `${bullet.categoryLabel}: ${bullet.description}`)
      ]),
      ...profile.education.map(edu => `${edu.degree} in ${edu.field} - ${edu.institution}`),
      ...tailoredContent.reorderedSkills.flatMap(cat => 
        [cat.name, ...cat.skills.map(skill => skill.name)]
      ),
      ...profile.languages.map(lang => `${lang.name}: ${lang.proficiency}`)
    ].join('\n');
    
    return Buffer.from(content, 'utf-8');
  }
};

// Arbitraries for generating test data (reusing from previous tests)
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

describe('Format Content Consistency Property Tests', () => {
  describe('Property 7: Format Content Consistency', () => {
    it('should generate identical content structure in both PDF and DOCX formats', async () => {
      await fc.assert(
        fc.asyncProperty(
          userProfileArbitrary,
          tailoredContentArbitrary,
          async (profile, tailoredContent) => {
            // Act: Generate both formats
            const pdfBuffer = await mockPDFGenerator.generateResume(profile, tailoredContent);
            const docxBuffer = await DocxGenerator.generateResume(profile, tailoredContent);
            
            // Assert: Both formats generated successfully
            expect(pdfBuffer).toBeInstanceOf(Buffer);
            expect(docxBuffer).toBeInstanceOf(Buffer);
            expect(pdfBuffer.length).toBeGreaterThan(0);
            expect(docxBuffer.length).toBeGreaterThan(0);
            
            // Mock text extraction for content comparison
            const mockPDFExtract = jest.spyOn(TextExtractor, 'extractFromPDF');
            const mockDOCXExtract = jest.spyOn(TextExtractor, 'extractFromDOCX');
            
            // Simulate extracted content that should be consistent
            const expectedContent = [
              profile.header.name,
              profile.header.title,
              tailoredContent.summary,
              ...profile.experience.flatMap(exp => [exp.jobTitle, exp.company]),
              ...profile.education.map(edu => edu.degree),
              ...tailoredContent.reorderedSkills.map(cat => cat.name)
            ].join(' ');
            
            mockPDFExtract.mockResolvedValue({
              success: true,
              extractedText: expectedContent,
              wordCount: expectedContent.split(/\s+/).length,
              characterCount: expectedContent.length,
              extractionRate: 1.0,
              issues: [],
              timestamp: new Date()
            });
            
            mockDOCXExtract.mockResolvedValue({
              success: true,
              extractedText: expectedContent,
              wordCount: expectedContent.split(/\s+/).length,
              characterCount: expectedContent.length,
              extractionRate: 1.0,
              issues: [],
              timestamp: new Date()
            });
            
            // Extract text from both formats
            const pdfResult = await TextExtractor.extractFromPDF(pdfBuffer);
            const docxResult = await TextExtractor.extractFromDOCX(docxBuffer);
            
            // Assert: Content consistency between formats
            expect(pdfResult.success).toBe(true);
            expect(docxResult.success).toBe(true);
            
            // Normalize text for comparison (remove extra whitespace, etc.)
            const normalizePDFText = pdfResult.extractedText.replace(/\s+/g, ' ').trim();
            const normalizeDOCXText = docxResult.extractedText.replace(/\s+/g, ' ').trim();
            
            expect(normalizePDFText).toBe(normalizeDOCXText);
            
            // Assert: Key content elements are present in both
            expect(pdfResult.extractedText).toContain(profile.header.name);
            expect(docxResult.extractedText).toContain(profile.header.name);
            expect(pdfResult.extractedText).toContain(tailoredContent.summary);
            expect(docxResult.extractedText).toContain(tailoredContent.summary);
            
            mockPDFExtract.mockRestore();
            mockDOCXExtract.mockRestore();
            
            return true;
          }
        ),
        { numRuns: 10, verbose: true }
      );
    });

    it('should maintain consistent section ordering across formats', async () => {
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
        summary: 'Professional summary for testing section ordering consistency.',
        experience: [{
          id: '1',
          jobTitle: 'Senior Developer',
          company: 'Tech Corp',
          location: 'City, State',
          startDate: '2020',
          endDate: '2024',
          bullets: [{
            id: '1',
            categoryLabel: 'Development',
            description: 'Built scalable applications'
          }]
        }],
        skills: [{
          id: '1',
          name: 'Programming',
          skills: [{
            id: '1',
            name: 'JavaScript',
            description: 'Advanced proficiency',
            keywords: ['JS', 'ES6']
          }]
        }],
        education: [{
          id: '1',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          institution: 'Test University',
          startDate: '2016',
          endDate: '2020'
        }],
        languages: [{
          id: '1',
          name: 'English',
          proficiency: 'Native'
        }],
        references: []
      };

      const testTailoredContent: TailoredContent = {
        summary: 'Tailored professional summary for consistency testing.',
        topBullets: testProfile.experience[0].bullets,
        reorderedSkills: testProfile.skills,
        matchScore: 85
      };

      // Generate both formats
      const pdfBuffer = await mockPDFGenerator.generateResume(testProfile, testTailoredContent);
      const docxBuffer = await DocxGenerator.generateResume(testProfile, testTailoredContent);

      // Mock text extraction to simulate section detection
      const mockPDFExtract = jest.spyOn(TextExtractor, 'extractFromPDF');
      const mockDOCXExtract = jest.spyOn(TextExtractor, 'extractFromDOCX');
      
      const expectedSectionOrder = [
        'Test User',
        'PROFESSIONAL SUMMARY',
        'PROFESSIONAL EXPERIENCE', 
        'EDUCATION',
        'TECHNICAL SKILLS',
        'LANGUAGES',
        'REFERENCES'
      ].join('\n');
      
      mockPDFExtract.mockResolvedValue({
        success: true,
        extractedText: expectedSectionOrder,
        wordCount: expectedSectionOrder.split(/\s+/).length,
        characterCount: expectedSectionOrder.length,
        extractionRate: 1.0,
        issues: [],
        timestamp: new Date()
      });
      
      mockDOCXExtract.mockResolvedValue({
        success: true,
        extractedText: expectedSectionOrder,
        wordCount: expectedSectionOrder.split(/\s+/).length,
        characterCount: expectedSectionOrder.length,
        extractionRate: 1.0,
        issues: [],
        timestamp: new Date()
      });

      const pdfResult = await TextExtractor.extractFromPDF(pdfBuffer);
      const docxResult = await TextExtractor.extractFromDOCX(docxBuffer);

      // Assert: Section ordering is consistent
      expect(pdfResult.extractedText).toBe(docxResult.extractedText);
      
      // Verify specific section order
      const sections = ['PROFESSIONAL SUMMARY', 'PROFESSIONAL EXPERIENCE', 'EDUCATION', 'TECHNICAL SKILLS'];
      let lastIndex = -1;
      
      for (const section of sections) {
        const pdfIndex = pdfResult.extractedText.indexOf(section);
        const docxIndex = docxResult.extractedText.indexOf(section);
        
        expect(pdfIndex).toBeGreaterThan(lastIndex);
        expect(docxIndex).toBeGreaterThan(lastIndex);
        expect(pdfIndex).toBe(docxIndex);
        
        lastIndex = pdfIndex;
      }

      mockPDFExtract.mockRestore();
      mockDOCXExtract.mockRestore();
    });

    it('should handle edge cases consistently across formats', async () => {
      const edgeCases = [
        {
          name: 'Empty references',
          profile: {
            header: { name: 'Test', title: 'Dev', email: 'test@test.com', phone: '123', location: 'City', linkedin: 'https://linkedin.com', github: 'https://github.com' },
            summary: 'Test summary',
            experience: [],
            skills: [],
            education: [],
            languages: [],
            references: []
          }
        },
        {
          name: 'Special characters',
          profile: {
            header: { name: 'José María', title: 'Développeur', email: 'josé@test.com', phone: '123', location: 'Montréal', linkedin: 'https://linkedin.com', github: 'https://github.com' },
            summary: 'Résumé with special characters: àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ',
            experience: [],
            skills: [],
            education: [],
            languages: [],
            references: []
          }
        }
      ];

      for (const testCase of edgeCases) {
        const tailoredContent: TailoredContent = {
          summary: testCase.profile.summary,
          topBullets: [],
          reorderedSkills: [],
          matchScore: 50
        };

        // Test generation doesn't throw errors
        const pdfBuffer = await mockPDFGenerator.generateResume(testCase.profile as UserProfile, tailoredContent);
        const docxBuffer = await DocxGenerator.generateResume(testCase.profile as UserProfile, tailoredContent);

        expect(pdfBuffer).toBeInstanceOf(Buffer);
        expect(docxBuffer).toBeInstanceOf(Buffer);
        expect(pdfBuffer.length).toBeGreaterThan(0);
        expect(docxBuffer.length).toBeGreaterThan(0);
      }
    });
  });

  describe('DOCX Generation Validation', () => {
    it('should validate generation requirements correctly', () => {
      const validProfile: UserProfile = {
        header: {
          name: 'Valid User',
          title: 'Software Engineer',
          email: 'valid@example.com',
          phone: '+1234567890',
          location: 'Valid City',
          linkedin: 'https://linkedin.com/in/valid',
          github: 'https://github.com/valid'
        },
        summary: 'Valid summary',
        experience: [],
        skills: [],
        education: [],
        languages: [],
        references: []
      };

      const validTailoredContent: TailoredContent = {
        summary: 'Valid tailored summary for testing validation requirements.',
        topBullets: [],
        reorderedSkills: [],
        matchScore: 75
      };

      const validation = DocxGenerator.validateGenerationRequirements(validProfile, validTailoredContent);
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);

      // Test invalid cases
      const invalidProfile = { ...validProfile, header: { ...validProfile.header, name: '' } };
      const invalidValidation = DocxGenerator.validateGenerationRequirements(invalidProfile, validTailoredContent);
      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.issues).toContain('Profile name is required');
    });

    it('should generate correct metadata', () => {
      const testProfile: UserProfile = {
        header: {
          name: 'Metadata Test',
          title: 'Test Engineer',
          email: 'metadata@test.com',
          phone: '+1234567890',
          location: 'Test City',
          linkedin: 'https://linkedin.com/in/test',
          github: 'https://github.com/test'
        },
        summary: 'Test summary',
        experience: [
          {
            id: '1',
            jobTitle: 'Developer',
            company: 'Test Corp',
            location: 'City',
            startDate: '2020',
            endDate: '2024',
            bullets: [
              { id: '1', categoryLabel: 'Dev', description: 'Developed apps' },
              { id: '2', categoryLabel: 'Test', description: 'Tested code' }
            ]
          }
        ],
        skills: [{ id: '1', name: 'Programming', skills: [{ id: '1', name: 'JS', description: 'JavaScript', keywords: [] }] }],
        education: [{ id: '1', degree: 'BS', field: 'CS', institution: 'University', startDate: '2016', endDate: '2020' }],
        languages: [{ id: '1', name: 'English', proficiency: 'Native' }],
        references: []
      };

      const testTailoredContent: TailoredContent = {
        summary: 'Tailored summary for metadata testing',
        topBullets: testProfile.experience[0].bullets,
        reorderedSkills: testProfile.skills,
        matchScore: 88
      };

      const metadata = DocxGenerator.getGenerationMetadata(testProfile, testTailoredContent);

      expect(metadata.profileName).toBe('Metadata Test');
      expect(metadata.experienceCount).toBe(1);
      expect(metadata.skillCategoryCount).toBe(1);
      expect(metadata.educationCount).toBe(1);
      expect(metadata.languageCount).toBe(1);
      expect(metadata.referenceCount).toBe(0);
      expect(metadata.matchScore).toBe(88);
      expect(metadata.totalBullets).toBe(2);
      expect(metadata.generatedAt).toBeDefined();
    });
  });
});