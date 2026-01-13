import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { UserProfile, TailoredContent } from '@/types';
import { getResumeFont } from '@/fonts';

// No font registration needed - using standard PDF fonts

const styles = StyleSheet.create({
  page: {
    ...getResumeFont('body'),
    paddingTop: 35,
    paddingBottom: 35,
    paddingHorizontal: 35,
    lineHeight: 1.2,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 15, // Compact header
    paddingBottom: 10,
    borderBottom: '1.5pt solid #2c3e50',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 60, // Smaller photo
    marginLeft: 12,
  },
  profileImage: {
    width: 60, // Smaller photo to save space
    height: 60,
    borderRadius: 30,
    objectFit: 'cover',
  },
  name: {
    ...getResumeFont('heading'),
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  title: {
    ...getResumeFont('body'),
    fontSize: 12, // Slightly larger than body for job title
    marginBottom: 6,
    fontWeight: 'bold',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 3,
  },
  contact: {
    ...getResumeFont('contact'),
    color: '#7f8c8d',
    marginHorizontal: 4,
  },
  section: {
    marginBottom: 12, // Tighter sections
  },
  sectionTitle: {
    ...getResumeFont('body'),
    fontSize: 11, // Slightly larger than body for section titles
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
    color: '#2c3e50',
    borderBottom: '1pt solid #3498db',
    paddingBottom: 2,
    letterSpacing: 0.3,
  },
  experienceEntry: {
    marginBottom: 10, // Tighter experience entries
    paddingLeft: 2,
  },
  jobTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  jobTitle: {
    ...getResumeFont('body'),
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  dateRange: {
    ...getResumeFont('contact'),
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  companyInfo: {
    ...getResumeFont('minor'),
    marginBottom: 4,
    color: '#34495e',
    fontWeight: 'bold',
  },
  bulletPoint: {
    ...getResumeFont('contact'),
    marginBottom: 3,
    marginLeft: 8,
    lineHeight: 1.3,
    color: '#2c3e50',
  },
  bulletCategory: {
    fontWeight: 'bold',
    color: '#3498db',
  },
  bulletText: {
    color: '#2c3e50',
  },
  skillCategory: {
    marginBottom: 6, // Tighter skill sections
    paddingLeft: 2,
  },
  skillTitle: {
    ...getResumeFont('minor'),
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#2c3e50',
  },
  skillList: {
    ...getResumeFont('contact'),
    marginLeft: 8,
    lineHeight: 1.2,
    color: '#34495e',
  },
  educationEntry: {
    marginBottom: 8, // Tighter education
    paddingLeft: 2,
  },
  degreeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  degree: {
    ...getResumeFont('minor'),
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  institution: {
    ...getResumeFont('contact'),
    color: '#34495e',
    marginBottom: 2,
  },
  languageEntry: {
    marginBottom: 4, // Tighter languages
    paddingLeft: 2,
  },
  languageName: {
    ...getResumeFont('contact'),
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  languageLevel: {
    ...getResumeFont('contact'),
    color: '#34495e',
  },
  referenceEntry: {
    marginBottom: 8, // Tighter references
    paddingLeft: 2,
  },
  referenceName: {
    ...getResumeFont('minor'),
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 1,
  },
  referenceTitle: {
    ...getResumeFont('contact'),
    color: '#34495e',
    marginBottom: 1,
  },
  referenceContact: {
    ...getResumeFont('contact'),
    color: '#7f8c8d',
  },
  defaultText: {
    ...getResumeFont('minor'),
    color: '#7f8c8d',
    paddingLeft: 5,
  },
});

interface EnglishCVPDFProps {
  profile: UserProfile;
  tailoredContent: TailoredContent;
}

export const EnglishCVPDF: React.FC<EnglishCVPDFProps> = ({ profile, tailoredContent }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.name}>{profile.header.name}</Text>
            <Text style={styles.title}>{profile.header.title}</Text>
            <View style={styles.contactRow}>
              <Text style={styles.contact}>{profile.header.location}</Text>
              <Text style={styles.contact}>•</Text>
              <Text style={styles.contact}>{profile.header.phone}</Text>
              <Text style={styles.contact}>•</Text>
              <Text style={styles.contact}>{profile.header.email}</Text>
            </View>
            <View style={styles.contactRow}>
              <Text style={styles.contact}>{profile.header.linkedin}</Text>
              <Text style={styles.contact}>•</Text>
              <Text style={styles.contact}>{profile.header.github}</Text>
            </View>
          </View>
          {profile.header.photo && (
            <View style={styles.headerRight}>
              <Image
                src={profile.header.photo}
                style={styles.profileImage}
              />
            </View>
          )}
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
          <Text style={[styles.contact, { lineHeight: 1.3, color: '#2c3e50' }]}>
            {tailoredContent.summary}
          </Text>
        </View>

        {/* Professional Experience Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFESSIONAL EXPERIENCE</Text>
          {profile.experience.map((exp, index) => (
            <View key={exp.id} style={styles.experienceEntry}>
              <View style={styles.jobTitleRow}>
                <Text style={styles.jobTitle}>
                  {exp.jobTitle}{exp.subtitle ? ` | ${exp.subtitle}` : ''}
                </Text>
                <Text style={styles.dateRange}>
                  {exp.startDate} – {exp.endDate === 'Heute' ? 'Present' : exp.endDate}
                </Text>
              </View>
              <Text style={styles.companyInfo}>
                {exp.company}, {exp.location}
              </Text>
              {exp.bullets.map((bullet, bulletIndex) => (
                <View key={bullet.id} style={styles.bulletPoint}>
                  <Text>
                    <Text style={styles.bulletCategory}>• {bullet.categoryLabel}:</Text>
                    <Text style={styles.bulletText}> {bullet.description}</Text>
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Education Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EDUCATION</Text>
          {profile.education.map((edu, index) => (
            <View key={edu.id} style={styles.educationEntry}>
              <View style={styles.degreeRow}>
                <Text style={styles.degree}>{edu.degree} in {edu.field}</Text>
                <Text style={styles.dateRange}>{edu.startDate} – {edu.endDate}</Text>
              </View>
              <Text style={styles.institution}>{edu.institution}</Text>
              {edu.details && (
                <Text style={{ fontSize: 11, color: '#34495e', marginTop: 4 }}>
                  {edu.details}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Technical Skills Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TECHNICAL SKILLS & COMPETENCIES</Text>
          {tailoredContent.reorderedSkills.map((category, index) => (
            <View key={category.id} style={styles.skillCategory}>
              <Text style={styles.skillTitle}>{category.name}:</Text>
              <Text style={styles.skillList}>
                {category.skills.map(skill => skill.name).join(' • ')}
              </Text>
            </View>
          ))}
        </View>

        {/* Languages Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LANGUAGES</Text>
          {profile.languages.map((lang, index) => (
            <View key={lang.id} style={styles.languageEntry}>
              <Text>
                <Text style={styles.languageName}>{lang.name}: </Text>
                <Text style={styles.languageLevel}>{lang.proficiency}</Text>
              </Text>
            </View>
          ))}
        </View>

        {/* References Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REFERENCES</Text>
          {profile.references.length > 0 ? (
            profile.references.map((ref, index) => (
              <View key={ref.id} style={styles.referenceEntry}>
                <Text style={styles.referenceName}>{ref.name}</Text>
                <Text style={styles.referenceTitle}>{ref.title}, {ref.company}</Text>
                <Text style={styles.referenceContact}>{ref.email}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.defaultText}>
              Available upon request
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
};