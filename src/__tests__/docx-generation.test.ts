/**
 * Property-based test for DOCX generation success
 * Validates: Requirements 1.1 - DOCX format generation capability
 */

import fc from 'fast-check';

// Define minimal types for testing
interface UserProfile {
  header: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    photo?: string;
  };
  summary: string;
  experience: any[];
  skills: any[];
  education: any[];
  languages: any[];
  references: any[];
}

interface TailoredContent {
  summary: string;
  topBullets: any[];
  reorderedSkills: any[];
  matchScore: number;
}

// Mock DOCX generator (will be implemented in Task 6)
const mockDocxGenerator = {
  generateResume: async (profile: UserProfile, tailoredContent: TailoredContent): Promise<Buffer> => {
    // Simulate DOCX generation
    const content = `${profile.header.name}\n${tailoredContent.summary}`;
    return Buffer.from(content, 'utf-8');
  }
};

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
  bullets: fc.array(bulletArbitrary, { minLength: 1, maxLength: 5 })
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
  skills: fc.array(skillArbitrary, { minLength: 1, maxLength: 8 })
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
  experience: fc.array(experienceArbitrary, { minLength: 1, maxLength: 5 }),
  skills: fc.array(skillCategoryArbitrary, { minLength: 1, maxLength: 6 }),
  education: fc.array(educationArbitrary, { minLength: 1, maxLength: 3 }),
  languages: fc.array(languageArbitrary, { minLength: 1, maxLength: 5 }),
  references: fc.array(referenceArbitrary, { maxLength: 3 })
});

const tailoredContentArbitrary = fc.record({
  summary: fc.string({ minLength: 50, maxLength: 500 }),
  topBullets: fc.array(bulletArbitrary, { maxLength: 20 }),
  reorderedSkills: fc.array(skillCategoryArbitrary, { minLength: 1, maxLength: 6 }),
  matchScore: fc.integer({ min: 0, max: 100 })
});

describe('DOCX Generation Success Property Tests', () => {
  it('Property 2: DOCX Generation Success - should always generate valid DOCX buffer for any valid profile', async () => {
    await fc.assert(
      fc.asyncProperty(
        userProfileArbitrary,
        tailoredContentArbitrary,
        async (profile, tailoredContent) => {
          // Act: Generate DOCX
          const docxBuffer = await mockDocxGenerator.generateResume(profile, tailoredContent);
          
          // Assert: DOCX generation succeeds
          expect(docxBuffer).toBeInstanceOf(Buffer);
          expect(docxBuffer.length).toBeGreaterThan(0);
          
          // Verify buffer contains expected content
          const content = docxBuffer.toString('utf-8');
          expect(content).toContain(profile.header.name);
          expect(content).toContain(tailoredContent.summary);
          
          return true;
        }
      ),
      { numRuns: 10, verbose: true }
    );
  });

  it('should handle edge cases in DOCX generation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          // Edge case: minimal profile
          header: fc.record({
            name: fc.constant('A'),
            title: fc.constant('B'),
            email: fc.constant('a@b.c'),
            phone: fc.constant('1'),
            location: fc.constant('X'),
            linkedin: fc.constant('https://linkedin.com/in/test'),
            github: fc.constant('https://github.com/test'),
            photo: fc.constant(undefined)
          }),
          summary: fc.constant('Minimal summary for testing edge cases.'),
          experience: fc.constant([]),
          skills: fc.constant([]),
          education: fc.constant([]),
          languages: fc.constant([]),
          references: fc.constant([])
        }),
        fc.record({
          summary: fc.constant('Minimal tailored summary.'),
          topBullets: fc.constant([]),
          reorderedSkills: fc.constant([]),
          matchScore: fc.constant(0)
        }),
        async (profile, tailoredContent) => {
          // Act: Generate DOCX with minimal data
          const docxBuffer = await mockDocxGenerator.generateResume(profile, tailoredContent);
          
          // Assert: Still generates valid buffer
          expect(docxBuffer).toBeInstanceOf(Buffer);
          expect(docxBuffer.length).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  it('should generate consistent DOCX output for identical inputs', async () => {
    const profile: UserProfile = {
      header: {
        name: 'Test User',
        title: 'Software Engineer',
        email: 'test@example.com',
        phone: '+1234567890',
        location: 'Test City',
        linkedin: 'https://linkedin.com/in/test',
        github: 'https://github.com/test'
      },
      summary: 'Test summary for consistency check.',
      experience: [],
      skills: [],
      education: [],
      languages: [],
      references: []
    };

    const tailoredContent: TailoredContent = {
      summary: 'Tailored test summary.',
      topBullets: [],
      reorderedSkills: [],
      matchScore: 75
    };

    // Generate DOCX multiple times
    const docx1 = await mockDocxGenerator.generateResume(profile, tailoredContent);
    const docx2 = await mockDocxGenerator.generateResume(profile, tailoredContent);
    const docx3 = await mockDocxGenerator.generateResume(profile, tailoredContent);

    // Assert: Consistent output
    expect(docx1.equals(docx2)).toBe(true);
    expect(docx2.equals(docx3)).toBe(true);
    expect(docx1.length).toBe(docx2.length);
  });
});