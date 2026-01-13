'use client';

import React from 'react';
import { ExperienceEntry } from '@/types';
import { ResumeSection } from './ResumeSection';

interface ExperienceSectionProps {
  experiences: ExperienceEntry[];
  title: string;
  language?: 'en' | 'de';
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ 
  experiences, 
  title, 
  language = 'en' 
}) => {
  const isGerman = language === 'de';

  return (
    <ResumeSection title={title} className="experience-section">
      {experiences.map((exp, index) => (
        <div key={exp.id} className="experience-entry">
          <div className="experience-header">
            <div className="job-info">
              <h4 className="job-title">
                {exp.jobTitle}{exp.subtitle ? ` | ${exp.subtitle}` : ''}
              </h4>
              <p className="company-info">
                {isGerman 
                  ? `${exp.company}, ${exp.location}, ${exp.startDate} – ${exp.endDate}`
                  : `${exp.company}, ${exp.location}`
                }
              </p>
            </div>
            {!isGerman && (
              <div className="date-range">
                {exp.startDate} – {exp.endDate === 'Heute' ? 'Present' : exp.endDate}
              </div>
            )}
          </div>
          
          <ul className="bullet-list">
            {exp.bullets.map((bullet) => (
              <li key={bullet.id} className="bullet-point">
                <span className="bullet-category">{bullet.categoryLabel}:</span>
                <span className="bullet-description"> {bullet.description}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </ResumeSection>
  );
};