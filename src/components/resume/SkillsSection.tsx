'use client';

import React from 'react';
import { SkillCategory } from '@/types';
import { ResumeSection } from './ResumeSection';

interface SkillsSectionProps {
  skills: SkillCategory[];
  title: string;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ skills, title }) => {
  return (
    <ResumeSection title={title} className="skills-section">
      {skills.map((category) => (
        <div key={category.id} className="skill-category">
          <h4 className="skill-category-title">{category.name}:</h4>
          <p className="skill-list">
            {category.skills.map(skill => skill.name).join(' • ')}
          </p>
        </div>
      ))}
    </ResumeSection>
  );
};