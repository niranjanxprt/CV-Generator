'use client';

import React from 'react';
import { EducationEntry } from '@/types';
import { ResumeSection } from './ResumeSection';

interface EducationSectionProps {
  education: EducationEntry[];
  title: string;
  language?: 'en' | 'de';
}

export const EducationSection: React.FC<EducationSectionProps> = ({ 
  education, 
  title, 
  language = 'en' 
}) => {
  const isGerman = language === 'de';

  return (
    <ResumeSection title={title} className="education-section">
      {education.map((edu) => (
        <div key={edu.id} className="education-entry">
          <div className="education-header">
            <h4 className="degree">{edu.degree} in {edu.field}</h4>
            <span className="date-range">
              {edu.startDate} – {edu.endDate}
            </span>
          </div>
          <p className="institution">{edu.institution}</p>
          {edu.details && (
            <p className="education-details">{edu.details}</p>
          )}
        </div>
      ))}
    </ResumeSection>
  );
};