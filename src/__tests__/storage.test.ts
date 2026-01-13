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

// Arbitraries for generating test data
const headerArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  location: fc.string({ minLength: 1, maxLength: 50 }),
  phone: fc.string({ minLength: 10, maxLength: 20 }),
  email: fc.emailAddress(),
  linkedin: fc.webUrl(),
  github: fc.webUrl()
});

const bulletArbitrary = fc.record({
  id: fc.uuid(),
  categoryLabel: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  keywords: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
  score: fc.option(fc.integer({ min: 0, max: 100 }))
});

const experienceArbitrary = fc.record({
  id: fc.uuid(),
  jobTitle: fc.string({ minLength: 1, maxLength: 50 }),
  subtitle: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  company: fc.string({ minLength: 1, maxLength: 50 }),
  location: fc.string({ minLength: 1, maxLength: 50 }),
  startDate: fc.string().filter(s => /^\d{2}\/\d{4}$/.test(s)),
  endDate: fc.oneof(
    fc.string().filter(s => /^\d{2}\/\d{4}$/.test(s)),
    fc.constant('Heute'),
    fc.constant('Present')
  ),
  bullets: fc.array(bulletArbitrary, { minLength: 1, maxLength: 8 })
});

const skillArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 30 }),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  keywords: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 })
});

const skillCategoryArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  skills: fc.array(skillArbitrary, { minLength: 1, maxLength: 5 }),
  relevanceScore: fc.option(fc.integer({ min: 0, max: 100 }))
});

const educationArbitrary = fc.record({
  id: fc.uuid(),
  degree: fc.string({ minLength: 1, maxLength: 50 }),
  field: fc.string({ minLength: 1, maxLength: 50 }),
  institution: fc.string({ minLength: 1, maxLength: 50 }),
  startDate: fc.string().filter(s => /^\d{2}\/\d{4}$/.test(s)),
  endDate: fc.string().filter(s => /^\d{2}\/\d{4}$/.test(s)),
  details: fc.option(fc.string({ maxLength: 200 }))
});

const languageArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  proficiency: fc.string({ minLength: 1, maxLength: 50 })
});

const referenceArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  company: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress()
});

const profileArbitrary = fc.record({
  header: headerArbitrary,
  summary: fc.string({ minLength: 50, maxLength: 500 }),
  experience: fc.array(experienceArbitrary, { minLength: 1, maxLength: 5 }),
  education: fc.array(educationArbitrary, { minLength: 1, maxLength: 3 }),
  skills: fc.array(skillCategoryArbitrary, { minLength: 1, maxLength: 5 }),
  languages: fc.array(languageArbitrary, { minLength: 1, maxLength: 5 }),
  references: fc.array(referenceArbitrary, { minLength: 1, maxLength: 3 })
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
    ), { numRuns: 100 });
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
    ), { numRuns: 50 });
  });
});