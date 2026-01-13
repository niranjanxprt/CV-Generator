import { UserProfile, StoredProfile } from '@/types';
import { handleStorageError } from './error-handling';

const PROFILE_KEY = 'cv-generator-profile';
const CURRENT_VERSION = '1.0.0';

/**
 * Save user profile to localStorage with versioning
 */
export function saveProfileToLocalStorage(profile: UserProfile): void {
  try {
    const storedProfile: StoredProfile = {
      version: CURRENT_VERSION,
      lastUpdated: new Date().toISOString(),
      profile
    };
    
    localStorage.setItem(PROFILE_KEY, JSON.stringify(storedProfile));
  } catch (error) {
    handleStorageError(error as Error, 'saving profile');
  }
}

/**
 * Load user profile from localStorage with version migration
 */
export function loadProfileFromLocalStorage(): UserProfile | null {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (!stored) return null;
    
    const storedProfile: StoredProfile = JSON.parse(stored);
    
    // Handle version migration if needed
    if (storedProfile.version !== CURRENT_VERSION) {
      // Perform migration logic here if needed
      console.log(`Migrating profile from version ${storedProfile.version} to ${CURRENT_VERSION}`);
    }
    
    return storedProfile.profile;
  } catch (error) {
    console.warn('Failed to load profile from localStorage:', error);
    return null;
  }
}

/**
 * Clear profile from localStorage
 */
export function clearProfileFromLocalStorage(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch (error) {
    console.warn('Failed to clear profile from localStorage:', error);
  }
}

/**
 * Check if profile exists in localStorage
 */
export function hasStoredProfile(): boolean {
  try {
    return localStorage.getItem(PROFILE_KEY) !== null;
  } catch (error) {
    return false;
  }
}