'use client';

import React from 'react';

interface ResumeSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({ 
  title, 
  children, 
  className = '' 
}) => {
  return (
    <section className={`resume-section ${className}`}>
      <h3 className="section-title">{title}</h3>
      <div className="section-content">
        {children}
      </div>
    </section>
  );
};