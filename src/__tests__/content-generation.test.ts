import { describe, it, expect } from '@jest/globals';
import { 
  generateCoverLetter,
  translateWithPerplexity,
  generateGermanContent,
  isGerman,
  validateGeneratedContent
} from '@/lib/content-generation';
import { UserProfile, JobAnalysis, TailoredContent } from '@/types';

// Mock data for testing
const mockProfile: UserProfile = {
  header: {
    name: 'Max Mustermann',
    title: 'Senior Software Engineer',
    location: 'Berlin, Germany',
    phone: '+49 123 456789',
    email: 'max.mustermann@example.com',
    linkedin: 'https://linkedin.com/in/maxmustermann',
    github: 'https://github.com/maxmustermann'
  },
  summary: 'Experienced software engineer with expertise in Python and web development.',
  experience: [],
  education: [],
  skills: [
    {
      id: '1',
      name: 'Python Development',
      skills: [
        { name: 'Django', description: 'Web framework', keywords: ['django', 'python', 'web'] },
        { name: 'FastAPI', description: 'API framework', keywords: ['fastapi', 'python', 'api'] }
      ]
    },
    {
      id: '2',
      name: 'Frontend Technologies',
      skills: [
        { name: 'React', description: 'UI library', keywords: ['react', 'javascript', 'frontend'] },
        { name: 'TypeScript', description: 'Typed JavaScript', keywords: ['typescript', 'javascript'] }
      ]
    }
  ],
  languages: [],
  references: []
};

const mockJobAnalysis: JobAnalysis = {
  jobTitle: 'Full Stack Developer',
  companyName: 'Tech Solutions GmbH',
  mustHaveKeywords: ['Python', 'React', 'API'],
  preferredKeywords: ['Django', 'TypeScript'],
  niceToHaveKeywords: ['Docker', 'AWS'],
  languageRequirement: 'German'
};

const mockTailoredContent: TailoredContent = {
  summary: 'Enhanced summary with job-relevant keywords',
  topBullets: [],
  reorderedSkills: mockProfile.skills,
  matchScore: 85
};

describe('Content Generation Tests', () => {
  describe('Cover Letter Generation', () => {
    it('should generate German cover letter with proper format', async () => {
      const coverLetter = await generateCoverLetter(
        mockProfile,
        mockJobAnalysis,
        mockTailoredContent,
        'German'
      );

      // Check basic structure
      expect(coverLetter).toContain('Max Mustermann');
      expect(coverLetter).toContain('Senior Software Engineer');
      expect(coverLetter).toContain('Berlin, Germany');
      expect(coverLetter).toContain('Tech Solutions GmbH');
      expect(coverLetter).toContain('Full Stack Developer');
      
      // Check German business format
      expect(coverLetter).toContain('Sehr geehrte Damen und Herren');
      expect(coverLetter).toContain('Mit freundlichen Grüßen');
      expect(coverLetter).toContain('Bewerbung als');
      
      // Check keyword integration
      expect(coverLetter).toContain('Python');
      expect(coverLetter).toContain('React');
      
      // Validate content
      const validation = validateGeneratedContent(coverLetter, 'coverLetter', 'German');
      expect(validation.warnings.length).toBeLessThanOrEqual(1); // Allow minor warnings
    });

    it('should generate English cover letter with proper format', async () => {
      const englishJobAnalysis = { ...mockJobAnalysis, languageRequirement: 'English' as const };
      const coverLetter = await generateCoverLetter(
        mockProfile,
        englishJobAnalysis,
        mockTailoredContent,
        'English'
      );

      // Check basic structure
      expect(coverLetter).toContain('Max Mustermann');
      expect(coverLetter).toContain('Senior Software Engineer');
      expect(coverLetter).toContain('Berlin, Germany');
      expect(coverLetter).toContain('Tech Solutions GmbH');
      expect(coverLetter).toContain('Full Stack Developer');
      
      // Check English business format
      expect(coverLetter).toContain('Dear Hiring Manager');
      expect(coverLetter).toContain('Best regards');
      expect(coverLetter).toContain('Application for');
      
      // Check keyword integration
      expect(coverLetter).toContain('Python');
      expect(coverLetter).toContain('React');
      
      // Validate content
      const validation = validateGeneratedContent(coverLetter, 'coverLetter', 'English');
      expect(validation.warnings.length).toBeLessThanOrEqual(3); // Allow minor warnings
    });

    it('should include relevant skills and keywords in cover letter', async () => {
      const coverLetter = await generateCoverLetter(
        mockProfile,
        mockJobAnalysis,
        mockTailoredContent,
        'German'
      );

      // Should include top skills
      expect(coverLetter).toContain('Python Development');
      
      // Should include must-have keywords
      mockJobAnalysis.mustHaveKeywords.forEach(keyword => {
        expect(coverLetter.toLowerCase()).toContain(keyword.toLowerCase());
      });
      
      // Should include some preferred keywords
      const preferredFound = mockJobAnalysis.preferredKeywords.some(keyword =>
        coverLetter.toLowerCase().includes(keyword.toLowerCase())
      );
      expect(preferredFound).toBe(true);
    });
  });

  describe('Translation Functionality', () => {
    it('should translate common CV terms from English to German', async () => {
      const englishText = 'Professional Experience and Education with Technical Skills';
      const germanText = await translateWithPerplexity(englishText);
      
      expect(germanText).toContain('Berufserfahrung');
      expect(germanText).toContain('Ausbildung');
      expect(germanText).toContain('Fähigkeiten'); // More flexible check
    });

    it('should translate business letter greetings', async () => {
      const englishText = 'Dear Hiring Manager, Best regards';
      const germanText = await translateWithPerplexity(englishText);
      
      expect(germanText).toContain('Sehr geehrte Damen und Herren');
      expect(germanText).toContain('Mit freundlichen Grüßen');
    });

    it('should handle text that is already in German', async () => {
      const germanText = 'Sehr geehrte Damen und Herren, Mit freundlichen Grüßen';
      const result = await translateWithPerplexity(germanText);
      
      // Should not double-translate
      expect(result).toContain('Sehr geehrte Damen und Herren');
      expect(result).toContain('Mit freundlichen Grüßen');
    });
  });

  describe('German Content Generation', () => {
    it('should generate German content from English input', async () => {
      const englishContent = 'Dear Hiring Manager, I am interested in the position. Best regards';
      const germanContent = await generateGermanContent(
        englishContent,
        mockProfile,
        mockJobAnalysis
      );
      
      expect(germanContent).toContain('Sehr geehrte Damen und Herren');
      expect(germanContent).toContain('Mit freundlichen Grüßen');
    });

    it('should detect and preserve existing German content', async () => {
      const germanContent = 'Sehr geehrte Damen und Herren, ich bin interessiert. Mit freundlichen Grüßen';
      const result = await generateGermanContent(
        germanContent,
        mockProfile,
        mockJobAnalysis
      );
      
      // Should return original German content
      expect(result).toBe(germanContent);
    });
  });

  describe('Language Detection', () => {
    it('should correctly identify German text', () => {
      const germanTexts = [
        'Sehr geehrte Damen und Herren, ich bin Max Mustermann',
        'Berufserfahrung und Ausbildung mit technischen Fähigkeiten',
        'Mit freundlichen Grüßen, heute ist ein guter Tag',
        'Ich habe meine Bewerbung für die Stellenausschreibung eingereicht'
      ];
      
      germanTexts.forEach(text => {
        expect(isGerman(text)).toBe(true);
      });
    });

    it('should correctly identify English text', () => {
      const englishTexts = [
        'Dear Hiring Manager, I am John Doe',
        'Professional Experience and Education with Technical Skills',
        'Best regards, today is a good day',
        'I have submitted my application for the job posting'
      ];
      
      englishTexts.forEach(text => {
        expect(isGerman(text)).toBe(false);
      });
    });

    it('should handle mixed or ambiguous text', () => {
      const mixedText = 'Hello, ich bin Max Mustermann from Berlin und ich habe';
      // Should lean towards German due to German indicators
      expect(isGerman(mixedText)).toBe(true);
      
      const ambiguousText = 'Technical skills and experience required';
      // Should be identified as English (no German indicators)
      expect(isGerman(ambiguousText)).toBe(false);
    });
  });

  describe('Content Validation', () => {
    it('should validate cover letter word count', () => {
      const shortContent = 'Short content';
      const validation1 = validateGeneratedContent(shortContent, 'coverLetter', 'English');
      expect(validation1.isValid).toBe(true); // Warnings but still valid
      expect(validation1.warnings.some(w => w.includes('too short'))).toBe(true);
      
      const longContent = 'Very '.repeat(650) + 'long content'; // 652 words > 600 word limit
      const validation2 = validateGeneratedContent(longContent, 'coverLetter', 'English');
      expect(validation2.isValid).toBe(false); // Should be invalid for too long
      expect(validation2.warnings.some(w => w.includes('too long'))).toBe(true);
    });

    it('should validate summary word count', () => {
      const shortSummary = 'Short';
      const validation1 = validateGeneratedContent(shortSummary, 'summary', 'English');
      expect(validation1.warnings.some(w => w.includes('too short'))).toBe(true);
      
      const longSummary = 'Very '.repeat(110) + 'long summary'; // 112 words > 100 word limit
      const validation2 = validateGeneratedContent(longSummary, 'summary', 'English');
      expect(validation2.warnings.some(w => w.includes('too long'))).toBe(true);
    });

    it('should validate language consistency', () => {
      const germanContent = 'Sehr geehrte Damen und Herren, ich bin interessiert';
      const validation1 = validateGeneratedContent(germanContent, 'coverLetter', 'German');
      expect(validation1.warnings.some(w => w.includes('Language mismatch'))).toBe(false);
      
      const validation2 = validateGeneratedContent(germanContent, 'coverLetter', 'English');
      expect(validation2.isValid).toBe(false);
      expect(validation2.warnings.some(w => w.includes('Language mismatch'))).toBe(true);
    });
  });
});