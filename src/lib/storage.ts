import { UserProfile, StoredProfile } from '@/types';

const STORAGE_KEY = 'cv-generator-profile';
const CURRENT_VERSION = '1.0';

export function saveProfileToLocalStorage(profile: UserProfile): void {
  try {
    const profileData: StoredProfile = {
      version: CURRENT_VERSION,
      lastUpdated: new Date().toISOString(),
      profile
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profileData));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new Error('Storage full. Please clear old data in settings.');
    }
    throw error;
  }
}

export function loadProfileFromLocalStorage(): UserProfile | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data: StoredProfile = JSON.parse(stored);

    // Handle version migrations
    if (data.version === '1.0') {
      return data.profile;
    }

    // Future: if (data.version === '0.9') { migrate to 1.0 }

    return data.profile;
  } catch (error) {
    console.error('Failed to load profile from localStorage:', error);
    return null;
  }
}

export function clearProfileFromLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}