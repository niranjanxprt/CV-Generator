import React from 'react';
import { UserProfile, TailoredContent } from '@/types';

interface PrintableCVProps {
  profile: UserProfile;
  tailoredContent: TailoredContent;
  language: 'en' | 'de';
}

export const PrintableCV: React.FC<PrintableCVProps> = ({ 
  profile, 
  tailoredContent, 
  language 
}) => {
  const isGerman = language === 'de';

  return (
    <div className="printable-cv">
      {/* Header */}
      <header className="cv-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="name">{profile.header.name}</h1>
            <h2 className="title">{profile.header.title}</h2>
            <div className="contact-info">
              <span>{profile.header.location}</span>
              <span>{profile.header.phone}</span>
              <span>{profile.header.email}</span>
            </div>
            <div className="contact-links">
              <span>{profile.header.linkedin}</span>
              <span>{profile.header.github}</span>
            </div>
          </div>
          {profile.header.photo && (
            <div className="header-photo">
              <img src={profile.header.photo} alt={profile.header.name} />
            </div>
          )}
        </div>
      </header>

      {/* Professional Summary */}
      <section className="cv-section">
        <h3 className="section-title">
          {isGerman ? 'PROFIL' : 'PROFESSIONAL SUMMARY'}
        </h3>
        <p className="summary">{tailoredContent.summary}</p>
      </section>

      {/* Professional Experience */}
      <section className="cv-section">
        <h3 className="section-title">
          {isGerman ? 'BERUFSERFAHRUNG' : 'PROFESSIONAL EXPERIENCE'}
        </h3>
        {profile.experience.map((exp) => (
          <div key={exp.id} className="experience-entry">
            <div className="job-header">
              <div className="job-title">
                {exp.jobTitle}{exp.subtitle ? ` | ${exp.subtitle}` : ''}
              </div>
              <div className="date-range">
                {exp.startDate} – {exp.endDate === 'Heute' ? (isGerman ? 'Heute' : 'Present') : exp.endDate}
              </div>
            </div>
            <div className="company-info">
              {exp.company}, {exp.location}
            </div>
            <ul className="bullet-list">
              {exp.bullets.slice(0, 3).map((bullet) => (
                <li key={bullet.id} className="bullet-item">
                  <strong>{bullet.categoryLabel}:</strong> {bullet.description}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Education */}
      <section className="cv-section">
        <h3 className="section-title">
          {isGerman ? 'AUSBILDUNG' : 'EDUCATION'}
        </h3>
        {profile.education.slice(0, 1).map((edu) => (
          <div key={edu.id} className="education-entry">
            <div className="education-header">
              <div className="degree">{edu.degree} in {edu.field}</div>
              <div className="date-range">{edu.startDate} – {edu.endDate}</div>
            </div>
            <div className="institution">{edu.institution}</div>
            {edu.details && <p className="education-details">{edu.details}</p>}
          </div>
        ))}
      </section>

      {/* Technical Skills */}
      <section className="cv-section">
        <h3 className="section-title">
          {isGerman ? 'TECHNISCHE FÄHIGKEITEN & KOMPETENZEN' : 'TECHNICAL SKILLS & COMPETENCIES'}
        </h3>
        {tailoredContent.reorderedSkills.slice(0, 3).map((category) => (
          <div key={category.id} className="skill-category">
            <strong className="skill-title">{category.name}:</strong>
            <span className="skill-list">
              {category.skills.map(skill => skill.name).join(' • ')}
            </span>
          </div>
        ))}
      </section>

      {/* Languages */}
      <section className="cv-section">
        <h3 className="section-title">
          {isGerman ? 'SPRACHKENNTNISSE' : 'LANGUAGES'}
        </h3>
        <div className="languages">
          {profile.languages.slice(0, 2).map((lang) => (
            <div key={lang.id} className="language-entry">
              <strong>{lang.name}:</strong> {lang.proficiency}
            </div>
          ))}
        </div>
      </section>

      {/* References */}
      <section className="cv-section">
        <h3 className="section-title">
          {isGerman ? 'REFERENZEN' : 'REFERENCES'}
        </h3>
        {profile.references.length > 0 ? (
          profile.references.slice(0, 1).map((ref) => (
            <div key={ref.id} className="reference-entry">
              <div className="reference-name">{ref.name}</div>
              <div className="reference-title">{ref.title}, {ref.company}</div>
              <div className="reference-contact">{ref.email}</div>
            </div>
          ))
        ) : (
          <p>{isGerman ? 'Auf Anfrage verfügbar' : 'Available upon request'}</p>
        )}
      </section>
    </div>
  );
};