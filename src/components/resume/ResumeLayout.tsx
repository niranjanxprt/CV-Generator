'use client';

import React from 'react';
import { UserProfile, TailoredContent } from '@/types';
import { ResumeHeader } from './ResumeHeader';
import { ResumeSection } from './ResumeSection';
import { ExperienceSection } from './ExperienceSection';
import { EducationSection } from './EducationSection';
import { SkillsSection } from './SkillsSection';
import { LanguagesSection } from './LanguagesSection';
import { ReferencesSection } from './ReferencesSection';

interface ResumeLayoutProps {
  profile: UserProfile;
  tailoredContent: TailoredContent;
  language?: 'en' | 'de';
}

export const ResumeLayout: React.FC<ResumeLayoutProps> = ({ 
  profile, 
  tailoredContent, 
  language = 'en' 
}) => {
  const isGerman = language === 'de';

  return (
    <div className="resume-container">
      {/* Page 1 */}
      <div className="resume-page">
        <ResumeHeader profile={profile} />
        
        <ResumeSection 
          title={isGerman ? 'PROFIL' : 'PROFESSIONAL SUMMARY'}
          className="summary-section"
        >
          <p className="summary-text">{tailoredContent.summary}</p>
        </ResumeSection>

        <ExperienceSection 
          experiences={profile.experience}
          title={isGerman ? 'BERUFSERFAHRUNG' : 'PROFESSIONAL EXPERIENCE'}
          language={language}
        />
      </div>

      {/* Page 2 */}
      <div className="resume-page">
        <EducationSection 
          education={profile.education}
          title={isGerman ? 'AUSBILDUNG' : 'EDUCATION'}
          language={language}
        />

        <SkillsSection 
          skills={tailoredContent.reorderedSkills}
          title={isGerman ? 'TECHNISCHE FÄHIGKEITEN & KOMPETENZEN' : 'TECHNICAL SKILLS & COMPETENCIES'}
        />

        <LanguagesSection 
          languages={profile.languages}
          title={isGerman ? 'SPRACHKENNTNISSE' : 'LANGUAGES'}
        />

        <ReferencesSection 
          references={profile.references}
          title={isGerman ? 'REFERENZEN' : 'REFERENCES'}
          language={language}
        />
      </div>
    </div>
  );
};