/**
 * Property-Based Tests for CV Import Data Integrity
 * Feature: cv-cover-letter-generator, Property 14: CV Import Data Integrity
 * Validates: Requirements 1.7, 1.8
 */

import * as fc from 'fast-check';
import { 
  validateCVFile, 
  calculateParsingConfidence, 
  addIdsToProfile, 
  generateParsingWarnings 
} from '@/lib/cv-import';
import { UserProfile } from '@/types';

// Mock File constructor for testing
class MockFile implements File {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  webkitRelativePath: string = '';

  constructor(name: string, size: number, type: string) {
    this.name = name;
    this.size = size;
    this.type = type;
    this.lastModified = Date.now();
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(this.size));
  }

  slice(): Blob {
    return new Blob();
  }

  stream(): ReadableStream<Uint8Array> {
    return new ReadableStream();
  }

  text(): Promise<string> {
    return Promise.resolve('mock file content');
  }
}

// Generator for valid file properties
const validFileArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }).map(s => s + '.pdf'),
  size: fc.integer({ min: 1, max: 10 * 1024 * 1024 }), // Up to 10MB
  type: fc.constantFrom('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
});

// Generator for invalid file properties
const invalidFileArbitrary = fc.oneof(
  // Too large files
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }).map(s => s + '.pdf'),
    size: fc.integer({ min: 10 * 1024 * 1024 + 1, max: 50 * 1024 * 1024 }),
    type: fc.constantFrom('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  }),
  // Invalid file types
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }).map(s => s + '.txt'),
    size: fc.integer({ min: 1, max: 1024 * 1024 }),
    type: fc.constantFrom('text/plain', 'image/jpeg', 'application/zip')
  }),
  // Too long filename
  fc.record({
    name: fc.string({ minLength: 256, maxLength: 300 }).map(s => s + '.pdf'),
    size: fc.integer({ min: 1, max: 1024 * 1024 }),
    type: fc.constantFrom('application/pdf')
  })
);

// Generator for partial UserProfile data (as returned by CV parsing)
const partialProfileArbitrary = fc.record({
  header: fc.option(fc.record({
    name: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
    title: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
    location: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
    phone: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
    email: fc.option(fc.emailAddress()),
    linkedin: fc.option(fc.string({ maxLength: 200 })),
    github: fc.option(fc.string({ maxLength: 200 }))
  })),
  summary: fc.option(fc.string({ minLength: 10, maxLength: 500 })),
  experience: fc.option(fc.array(fc.record({
    jobTitle: fc.string({ minLength: 1, maxLength: 100 }),
    company: fc.string({ minLength: 1, maxLength: 100 }),
    location: fc.string({ minLength: 1, maxLength: 100 }),
    startDate: fc.string({ minLength: 1, maxLength: 20 }),
    endDate: fc.string({ minLength: 1, maxLength: 20 }),
    bullets: fc.option(fc.array(fc.record({
      categoryLabel: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.string({ minLength: 1, maxLength: 500 })
    }), { maxLength: 5 }))
  }), { maxLength: 5 })),
  education: fc.option(fc.array(fc.record({
    degree: fc.string({ minLength: 1, maxLength: 100 }),
    field: fc.string({ minLength: 1, maxLength: 100 }),
    institution: fc.string({ minLength: 1, maxLength: 100 }),
    startDate: fc.string({ minLength: 1, maxLength: 20 }),
    endDate: fc.string({ minLength: 1, maxLength: 20 })
  }), { maxLength: 5 })),
  skills: fc.option(fc.array(fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    skills: fc.option(fc.array(fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.string({ minLength: 1, maxLength: 200 })
    }), { maxLength: 5 }))
  }), { maxLength: 5 })),
  languages: fc.option(fc.array(fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    proficiency: fc.string({ minLength: 1, maxLength: 100 })
  }), { maxLength: 5 })),
  references: fc.option(fc.array(fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    company: fc.string({ minLength: 1, maxLength: 100 }),
    email: fc.emailAddress()
  }), { maxLength: 5 }))
});

describe('CV Import Data Integrity Property Tests', () => {
  /**
   * Property 14a: File Validation Consistency
   * For any valid file (correct type, size <= 10MB, reasonable filename),
   * validation should always return isValid: true with no errors
   */
  test('Property 14a: Valid files always pass validation', () => {
    fc.assert(
      fc.property(
        validFileArbitrary,
        (fileProps) => {
          const file = new MockFile(fileProps.name, fileProps.size, fileProps.type);
          const result = validateCVFile(file);
          
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 14b: File Validation Rejection
   * For any invalid file (wrong type, too large, or invalid filename),
   * validation should always return isValid: false with appropriate errors
   */
  test('Property 14b: Invalid files always fail validation', () => {
    fc.assert(
      fc.property(
        invalidFileArbitrary,
        (fileProps) => {
          const file = new MockFile(fileProps.name, fileProps.size, fileProps.type);
          const result = validateCVFile(file);
          
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          
          // Verify error messages are descriptive
          result.errors.forEach(error => {
            expect(typeof error).toBe('string');
            expect(error.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 14c: Confidence Score Consistency
   * For any parsed profile data, confidence score should be between 0-100
   * and should increase with more complete data
   */
  test('Property 14c: Confidence score is always valid percentage', () => {
    fc.assert(
      fc.property(
        partialProfileArbitrary,
        fc.string({ minLength: 100, maxLength: 1000 }), // original text
        (parsedProfile, originalText) => {
          const confidence = calculateParsingConfidence(parsedProfile, originalText);
          
          // Confidence should be a valid percentage
          expect(confidence).toBeGreaterThanOrEqual(0);
          expect(confidence).toBeLessThanOrEqual(100);
          expect(Number.isInteger(confidence)).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 14d: ID Assignment Integrity
   * For any parsed profile data, adding IDs should preserve all original data
   * while adding unique IDs to all entries
   */
  test('Property 14d: ID assignment preserves data integrity', () => {
    fc.assert(
      fc.property(
        partialProfileArbitrary,
        (originalProfile) => {
          const profileWithIds = addIdsToProfile(originalProfile);
          
          // All original data should be preserved
          if (originalProfile.header) {
            expect(profileWithIds.header).toEqual(originalProfile.header);
          }
          
          if (originalProfile.summary) {
            expect(profileWithIds.summary).toEqual(originalProfile.summary);
          }
          
          // Arrays should have same length and content, but with IDs added
          if (originalProfile.experience) {
            expect(profileWithIds.experience).toHaveLength(originalProfile.experience.length);
            profileWithIds.experience?.forEach((exp, index) => {
              expect(exp.id).toBeDefined();
              expect(typeof exp.id).toBe('string');
              expect(exp.id.length).toBeGreaterThan(0);
              
              // Original data should be preserved
              expect(exp.jobTitle).toEqual(originalProfile.experience![index].jobTitle);
              expect(exp.company).toEqual(originalProfile.experience![index].company);
              
              // Bullets should have IDs too
              if (exp.bullets) {
                exp.bullets.forEach(bullet => {
                  expect(bullet.id).toBeDefined();
                  expect(typeof bullet.id).toBe('string');
                });
              }
            });
          }
          
          if (originalProfile.education) {
            expect(profileWithIds.education).toHaveLength(originalProfile.education.length);
            profileWithIds.education?.forEach(edu => {
              expect(edu.id).toBeDefined();
              expect(typeof edu.id).toBe('string');
            });
          }
          
          if (originalProfile.skills) {
            expect(profileWithIds.skills).toHaveLength(originalProfile.skills.length);
            profileWithIds.skills?.forEach(skill => {
              expect(skill.id).toBeDefined();
              expect(typeof skill.id).toBe('string');
            });
          }
          
          if (originalProfile.languages) {
            expect(profileWithIds.languages).toHaveLength(originalProfile.languages.length);
            profileWithIds.languages?.forEach(lang => {
              expect(lang.id).toBeDefined();
              expect(typeof lang.id).toBe('string');
            });
          }
          
          if (originalProfile.references) {
            expect(profileWithIds.references).toHaveLength(originalProfile.references.length);
            profileWithIds.references?.forEach(ref => {
              expect(ref.id).toBeDefined();
              expect(typeof ref.id).toBe('string');
            });
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 14e: Warning Generation Consistency
   * For any parsed profile data, warnings should be generated for missing critical fields
   * and should be descriptive strings
   */
  test('Property 14e: Warning generation is consistent and helpful', () => {
    fc.assert(
      fc.property(
        partialProfileArbitrary,
        (parsedProfile) => {
          const warnings = generateParsingWarnings(parsedProfile);
          
          // Warnings should be an array of strings
          expect(Array.isArray(warnings)).toBe(true);
          warnings.forEach(warning => {
            expect(typeof warning).toBe('string');
            expect(warning.length).toBeGreaterThan(0);
          });
          
          // If email is missing, there should be a warning about it
          if (!parsedProfile.header?.email) {
            expect(warnings.some(w => w.toLowerCase().includes('email'))).toBe(true);
          }
          
          // If phone is missing, there should be a warning about it
          if (!parsedProfile.header?.phone) {
            expect(warnings.some(w => w.toLowerCase().includes('phone'))).toBe(true);
          }
          
          // If no experience, there should be a warning
          if (!parsedProfile.experience || parsedProfile.experience.length === 0) {
            expect(warnings.some(w => w.toLowerCase().includes('experience'))).toBe(true);
          }
          
          // If no skills, there should be a warning
          if (!parsedProfile.skills || parsedProfile.skills.length === 0) {
            expect(warnings.some(w => w.toLowerCase().includes('skills'))).toBe(true);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 14f: ID Uniqueness
   * For any parsed profile with multiple entries, all generated IDs should be unique
   */
  test('Property 14f: All generated IDs are unique', () => {
    fc.assert(
      fc.property(
        partialProfileArbitrary,
        (originalProfile) => {
          const profileWithIds = addIdsToProfile(originalProfile);
          const allIds: string[] = [];
          
          // Collect all IDs
          profileWithIds.experience?.forEach(exp => {
            if (exp.id) allIds.push(exp.id);
            exp.bullets?.forEach(bullet => {
              if (bullet.id) allIds.push(bullet.id);
            });
          });
          
          profileWithIds.education?.forEach(edu => {
            if (edu.id) allIds.push(edu.id);
          });
          
          profileWithIds.skills?.forEach(skill => {
            if (skill.id) allIds.push(skill.id);
          });
          
          profileWithIds.languages?.forEach(lang => {
            if (lang.id) allIds.push(lang.id);
          });
          
          profileWithIds.references?.forEach(ref => {
            if (ref.id) allIds.push(ref.id);
          });
          
          // All IDs should be unique
          const uniqueIds = new Set(allIds);
          expect(uniqueIds.size).toBe(allIds.length);
        }
      ),
      { numRuns: 20 }
    );
  });
});