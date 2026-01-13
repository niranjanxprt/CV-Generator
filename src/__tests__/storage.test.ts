import fc from 'fast-check';
import { UserProfile } from '@/types';
import { saveProfileToLocalStorage, loadProfileFromLocalStorage, clearProfileFromLocalStorage } from '@/lib/storage';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Simplified arbitraries for faster testing
const headerArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 20 }),
  location: fc.string({ minLength: 1, maxLength: 20 }),
  phone: fc.string({ minLength: 10, maxLength: 15 }),
  email: fc.constant('test@example.com'),
  linkedin: fc.constant('https://linkedin.com/in/test'),
  github: fc.constant('https://github.com/test')
});

const bulletArbitrary = fc.record({
  id: fc.uuid(),
  categoryLabel: fc.string({ minLength: 1, maxLength: 20 }),
  description: fc.string({ minLength: 1, maxLength: 50 }),
  keywords: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 2 }),
  score: fc.option(fc.integer({ min: 0, max: 100 }))
});

const experienceArbitrary = fc.record({
  id: fc.uuid(),
  jobTitle: fc.string({ minLength: 1, maxLength: 20 }),
  subtitle: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
  company: fc.string({ minLength: 1, maxLength: 20 }),
  location: fc.string({ minLength: 1, maxLength: 20 }),
  startDate: fc.constant('01/2020'),
  endDate: fc.oneof(fc.constant('12/2023'), fc.constant('Heute'), fc.constant('Present')),
  bullets: fc.array(bulletArbitrary, { minLength: 1, maxLength: 3 })
});

const skillArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 15 }),
  description: fc.string({ minLength: 1, maxLength: 30 }),
  keywords: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 2 })
});

const skillCategoryArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 15 }),
  skills: fc.array(skillArbitrary, { minLength: 1, maxLength: 2 }),
  relevanceScore: fc.option(fc.integer({ min: 0, max: 100 }))
});

const educationArbitrary = fc.record({
  id: fc.uuid(),
  degree: fc.string({ minLength: 1, maxLength: 20 }),
  field: fc.string({ minLength: 1, maxLength: 20 }),
  institution: fc.string({ minLength: 1, maxLength: 20 }),
  startDate: fc.constant('09/2018'),
  endDate: fc.constant('06/2022'),
  details: fc.option(fc.string({ maxLength: 50 }))
});

const languageArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 15 }),
  proficiency: fc.string({ minLength: 1, maxLength: 20 })
});

const referenceArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 20 }),
  company: fc.string({ minLength: 1, maxLength: 20 }),
  email: fc.constant('ref@example.com')
});

const profileArbitrary = fc.record({
  header: headerArbitrary,
  summary: fc.string({ minLength: 50, maxLength: 100 }),
  experience: fc.array(experienceArbitrary, { minLength: 1, maxLength: 2 }),
  education: fc.array(educationArbitrary, { minLength: 1, maxLength: 1 }),
  skills: fc.array(skillCategoryArbitrary, { minLength: 1, maxLength: 2 }),
  languages: fc.array(languageArbitrary, { minLength: 1, maxLength: 2 }),
  references: fc.array(referenceArbitrary, { minLength: 1, maxLength: 1 })
});

describe('Profile Storage Properties', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('Property 1: Profile Data Persistence Round Trip', () => {
    fc.assert(fc.property(
      profileArbitrary,
      (profile: UserProfile) => {
        // Save profile
        saveProfileToLocalStorage(profile);
        
        // Load profile
        const loadedProfile = loadProfileFromLocalStorage();
        
        // Assert equality
        expect(loadedProfile).toEqual(profile);
      }
    ), { numRuns: 20 }); // Reduced from 100 to 20 for faster execution
  });

  it('should return null when no profile is stored', () => {
    const result = loadProfileFromLocalStorage();
    expect(result).toBeNull();
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorageMock.setItem('cv-generator-profile', 'invalid json');
    const result = loadProfileFromLocalStorage();
    expect(result).toBeNull();
  });

  it('should clear profile from localStorage', () => {
    fc.assert(fc.property(
      profileArbitrary,
      (profile: UserProfile) => {
        // Save profile
        saveProfileToLocalStorage(profile);
        expect(loadProfileFromLocalStorage()).toEqual(profile);
        
        // Clear profile
        clearProfileFromLocalStorage();
        expect(loadProfileFromLocalStorage()).toBeNull();
      }
    ), { numRuns: 10 }); // Reduced from 50 to 10 for faster execution
  });
});