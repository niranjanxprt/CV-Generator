/**
 * Property-Based Tests for Profile Auto-save Debouncing
 * Feature: cv-cover-letter-generator, Property 2: Auto-save Debouncing
 * Validates: Requirements 1.2
 */

import * as fc from 'fast-check';
import { saveProfileToLocalStorage, loadProfileFromLocalStorage, clearProfileFromLocalStorage } from '@/lib/storage';
import { UserProfile } from '@/types';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
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

// Generator for valid UserProfile data
const userProfileArbitrary = fc.record({
  header: fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    location: fc.string({ minLength: 1, maxLength: 50 }),
    phone: fc.string({ minLength: 1, maxLength: 20 }),
    email: fc.emailAddress(),
    linkedin: fc.string({ maxLength: 100 }),
    github: fc.string({ maxLength: 100 })
  }),
  summary: fc.string({ minLength: 50, maxLength: 200 }),
  experience: fc.array(fc.record({
    id: fc.uuid(),
    jobTitle: fc.string({ minLength: 1, maxLength: 50 }),
    company: fc.string({ minLength: 1, maxLength: 50 }),
    location: fc.string({ minLength: 1, maxLength: 50 }),
    startDate: fc.string({ minLength: 1, maxLength: 10 }),
    endDate: fc.string({ minLength: 1, maxLength: 10 }),
    bullets: fc.array(fc.record({
      id: fc.uuid(),
      categoryLabel: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 1, maxLength: 100 })
    }), { maxLength: 3 })
  }), { maxLength: 3 }),
  education: fc.array(fc.record({
    id: fc.uuid(),
    degree: fc.string({ minLength: 1, maxLength: 50 }),
    field: fc.string({ minLength: 1, maxLength: 50 }),
    institution: fc.string({ minLength: 1, maxLength: 50 }),
    startDate: fc.string({ minLength: 1, maxLength: 10 }),
    endDate: fc.string({ minLength: 1, maxLength: 10 })
  }), { maxLength: 3 }),
  skills: fc.array(fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    skills: fc.array(fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 1, maxLength: 100 }),
      keywords: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 })
    }), { maxLength: 3 })
  }), { maxLength: 3 }),
  languages: fc.array(fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    proficiency: fc.string({ minLength: 1, maxLength: 50 })
  }), { maxLength: 3 }),
  references: fc.array(fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    company: fc.string({ minLength: 1, maxLength: 50 }),
    email: fc.emailAddress()
  }), { maxLength: 3 })
});

// Debounce function for testing
function createDebouncedSave(delay: number = 1000) {
  let timeout: NodeJS.Timeout | null = null;
  let saveCount = 0;
  let lastSavedProfile: UserProfile | null = null;

  const debouncedSave = (profile: UserProfile) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      saveProfileToLocalStorage(profile);
      saveCount++;
      lastSavedProfile = profile;
    }, delay);
  };

  const getSaveCount = () => saveCount;
  const getLastSavedProfile = () => lastSavedProfile;
  const cleanup = () => {
    if (timeout) {
      clearTimeout(timeout);
    }
  };

  return { debouncedSave, getSaveCount, getLastSavedProfile, cleanup };
}

// Helper to wait for debounce
const waitForDebounce = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Profile Auto-save Debouncing Property Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  /**
   * Property 2: Auto-save Debouncing
   * For any sequence of profile updates within the debounce window,
   * only the final profile should be saved to localStorage
   */
  test('Property 2: Auto-save Debouncing - only final profile saved within debounce window', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(userProfileArbitrary, { minLength: 2, maxLength: 3 }),
        fc.integer({ min: 50, max: 100 }), // debounce delay
        async (profiles, debounceDelay) => {
          // Setup
          const { debouncedSave, getSaveCount, getLastSavedProfile, cleanup } = createDebouncedSave(debounceDelay);
          
          try {
            // Rapidly trigger multiple saves (within debounce window)
            profiles.forEach((profile, index) => {
              debouncedSave(profile);
            });

            // Wait for debounce to complete
            await waitForDebounce(debounceDelay + 50);

            // Verify only one save occurred
            expect(getSaveCount()).toBe(1);

            // Verify the last profile was saved
            const savedProfile = loadProfileFromLocalStorage();
            const lastProfile = profiles[profiles.length - 1];
            
            expect(savedProfile).toEqual(lastProfile);
            expect(getLastSavedProfile()).toEqual(lastProfile);

          } finally {
            cleanup();
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 15000);

  /**
   * Property 2b: Auto-save Debouncing - data integrity
   * For any valid profile data that goes through debounced save,
   * the saved data should be identical to the original data (round-trip property)
   */
  test('Property 2b: Auto-save Debouncing - data integrity preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        userProfileArbitrary,
        fc.integer({ min: 50, max: 100 }), // debounce delay
        async (profile, debounceDelay) => {
          // Setup
          const { debouncedSave, cleanup } = createDebouncedSave(debounceDelay);
          
          try {
            // Save profile through debounced function
            debouncedSave(profile);

            // Wait for debounce to complete
            await waitForDebounce(debounceDelay + 50);

            // Load and verify data integrity
            const savedProfile = loadProfileFromLocalStorage();
            expect(savedProfile).toEqual(profile);

            // Verify all nested objects and arrays are preserved
            expect(savedProfile?.header).toEqual(profile.header);
            expect(savedProfile?.experience).toEqual(profile.experience);
            expect(savedProfile?.education).toEqual(profile.education);
            expect(savedProfile?.skills).toEqual(profile.skills);
            expect(savedProfile?.languages).toEqual(profile.languages);
            expect(savedProfile?.references).toEqual(profile.references);

          } finally {
            cleanup();
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 15000);
});