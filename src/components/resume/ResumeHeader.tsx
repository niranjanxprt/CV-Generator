'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';

interface ResumeHeaderProps {
  profile: UserProfile;
}

export const ResumeHeader: React.FC<ResumeHeaderProps> = ({ profile }) => {
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    // Load profile photo from localStorage or profile data
    const savedPhoto = localStorage.getItem('profilePhoto');
    if (savedPhoto) {
      setProfilePhoto(savedPhoto);
    } else if (profile.header.photo) {
      setProfilePhoto(profile.header.photo);
    }
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
            />
          </div>
        )}
      </div>
    </header>
  );
};