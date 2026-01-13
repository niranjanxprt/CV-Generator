'use client';

import React from 'react';
import { LanguageEntry } from '@/types';
import { ResumeSection } from './ResumeSection';

interface LanguagesSectionProps {
  languages: LanguageEntry[];
  title: string;
}

export const LanguagesSection: React.FC<LanguagesSectionProps> = ({ languages, title }) => {
  return (
    <ResumeSection title={title} className="languages-section">
      {languages.map((lang) => (
        <div key={lang.id} className="language-entry">
          <span className="language-name">{lang.name}: </span>
          <span className="language-level">{lang.proficiency}</span>
        </div>
      ))}
    </ResumeSection>
  );
};