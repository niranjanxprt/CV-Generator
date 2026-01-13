import React from 'react';
import { UserProfile, JobAnalysis } from '@/types';

interface PrintableCoverLetterProps {
  profile: UserProfile;
  jobAnalysis: JobAnalysis;
  content: string;
  language: 'en' | 'de';
}

export const PrintableCoverLetter: React.FC<PrintableCoverLetterProps> = ({ 
  profile, 
  jobAnalysis, 
  content,
  language 
}) => {
  const isGerman = language === 'de';
  const currentDate = new Date().toLocaleDateString(isGerman ? 'de-DE' : 'en-US');
  
  // Split content into paragraphs and filter out header info
  const paragraphs = content.split('\n\n').filter(p => {
    const trimmed = p.trim();
    return trimmed && 
           !trimmed.includes(profile.header.name) &&
           !trimmed.includes(profile.header.title) &&
           !trimmed.includes(currentDate) &&
           !trimmed.includes('Bewerbung als') &&
           !trimmed.includes('Subject: Application for');
  });

  return (
    <div className="printable-cover-letter">
      {/* Header */}
      <header className="letter-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="name">{profile.header.name}</h1>
            <h2 className="title">{profile.header.title}</h2>
            <div className="contact-info">
              <div>{profile.header.location}</div>
              <div>{profile.header.phone} | {profile.header.email}</div>
              <div>{profile.header.linkedin} | {profile.header.github}</div>
            </div>
          </div>
          {profile.header.photo && (
            <div className="header-photo">
              <img src={profile.header.photo} alt={profile.header.name} />
            </div>
          )}
        </div>
      </header>

      {/* Date */}
      <div className="letter-date">{currentDate}</div>

      {/* Company Address */}
      {jobAnalysis.companyName && (
        <div className="company-address">
          {jobAnalysis.companyName}
        </div>
      )}

      {/* Subject */}
      <div className="letter-subject">
        {isGerman 
          ? `Bewerbung als ${jobAnalysis.jobTitle}`
          : `Subject: Application for ${jobAnalysis.jobTitle} Position`
        }
      </div>

      {/* Content */}
      <div className="letter-content">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="letter-paragraph">
            {paragraph.trim()}
          </p>
        ))}
      </div>

      {/* Closing */}
      <div className="letter-closing">
        <p className="closing-text">
          {isGerman ? 'Mit freundlichen Grüßen' : 'Best regards,'}
        </p>
        <p className="signature">{profile.header.name}</p>
      </div>
    </div>
  );
};