'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserProfile } from '@/types';
import { saveProfileToLocalStorage, loadProfileFromLocalStorage } from '@/lib/storage';
import { CVImportComponent } from '@/components/CVImportComponent';
import { ProfileForm } from '@/components/ProfileForm';
import Link from 'next/link';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load existing profile from localStorage
    const savedProfile = loadProfileFromLocalStorage();
    if (savedProfile) {
      setProfile(savedProfile);
    } else {
      // Initialize empty profile
      setProfile({
        header: {
          name: '',
          title: '',
          location: '',
          phone: '',
          email: '',
          linkedin: '',
          github: ''
        },
        summary: '',
        experience: [],
        education: [],
        skills: [],
        languages: [],
        references: []
      });
    }
    setIsLoading(false);
  }, []);

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    saveProfileToLocalStorage(updatedProfile);
  };

  const handleCVImport = (importedProfile: Partial<UserProfile>) => {
    if (profile) {
      const mergedProfile: UserProfile = {
        header: { ...profile.header, ...importedProfile.header },
        summary: importedProfile.summary || profile.summary,
        experience: importedProfile.experience || profile.experience,
        education: importedProfile.education || profile.education,
        skills: importedProfile.skills || profile.skills,
        languages: importedProfile.languages || profile.languages,
        references: importedProfile.references || profile.references
      };
      handleProfileUpdate(mergedProfile);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Professional Profile</h1>
            <p className="text-gray-600 mt-2">
              Enter your professional information once and reuse it for multiple applications
            </p>
          </div>
          <div className="flex space-x-4">
            <CVImportComponent onImportComplete={handleCVImport} />
            <Link href="/generate">
              <Button variant="outline">
                Continue to Generate →
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {profile && (
        <ProfileForm
          initialProfile={profile}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}