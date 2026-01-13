'use client';

import React from 'react';
import { ReferenceEntry } from '@/types';
import { ResumeSection } from './ResumeSection';

interface ReferencesSectionProps {
  references: ReferenceEntry[];
  title: string;
  language?: 'en' | 'de';
}

export const ReferencesSection: React.FC<ReferencesSectionProps> = ({ 
  references, 
  title, 
  language = 'en' 
}) => {
  const isGerman = language === 'de';

  return (
    <ResumeSection title={title} className="references-section">
      {references.length > 0 ? (
        references.map((ref) => (
          <div key={ref.id} className="reference-entry">
            <h4 className="reference-name">{ref.name}</h4>
            <p className="reference-title">{ref.title}, {ref.company}</p>
            <p className="reference-contact">{ref.email}</p>
          </div>
        ))
      ) : (
        <p className="no-references">
          {isGerman ? 'Auf Anfrage verfügbar' : 'Available upon request'}
        </p>
      )}
    </ResumeSection>
  );
};