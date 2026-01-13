'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';

interface ResumeHeaderProps {
  profile: UserProfile;
}

export const ResumeHeader: React.FC<ResumeHeaderProps> = ({ profile }) => {
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    // Load profile photo from multiple sources with priority
    const loadPhoto = () => {
      // Priority 1: Profile data photo
      if (profile.header.photo) {
        setProfilePhoto(profile.header.photo);
        return;
      }
      
      // Priority 2: localStorage profilePhoto
      const savedPhoto = localStorage.getItem('profilePhoto');
      if (savedPhoto) {
        setProfilePhoto(savedPhoto);
        return;
      }
      
      // Priority 3: Check if photo is in nested profile structure
      const storedProfile = localStorage.getItem('cv-generator-profile');
      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile);
          if (parsed.profile?.header?.photo) {
            setProfilePhoto(parsed.profile.header.photo);
            return;
          }
        } catch (error) {
          console.warn('Failed to parse stored profile for photo:', error);
        }
      }
    };

    loadPhoto();
  }, [profile.header.photo]);

  return (
    <header className="resume-header">
      <div className="header-content">
        <div className="header-text">
          <h1 className="name">{profile.header.name}</h1>
          <h2 className="title">{profile.header.title}</h2>
          <div className="contact-info">
            <div className="contact-row">
              <span>{profile.header.location}</span>
              <span className="separator">•</span>
              <span>{profile.header.phone}</span>
              <span className="separator">•</span>
              <span>{profile.header.email}</span>
            </div>
            <div className="contact-row">
              <span>{profile.header.linkedin}</span>
              <span className="separator">•</span>
              <span>{profile.header.github}</span>
            </div>
          </div>
        </div>
        {profilePhoto && (
          <div className="header-photo">
            <img 
              src={profilePhoto} 
              alt={profile.header.name}
              className="profile-image"
              onError={(e) => {
                console.warn('Failed to load profile image:', profilePhoto);
                // Hide the photo container if image fails to load
                const photoContainer = e.currentTarget.parentElement;
                if (photoContainer) {
                  photoContainer.style.display = 'none';
                }
              }}
            />
          </div>
        )}
      </div>
    </header>
  );
};