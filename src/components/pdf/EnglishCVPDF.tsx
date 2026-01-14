import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { UserProfile, TailoredContent } from '@/types';
import { getResumeFont } from '@/fonts';

// No font registration needed - using standard PDF fonts

const styles = StyleSheet.create({
  page: {
    ...getResumeFont('body'),
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 45,
    lineHeight: 1.4,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottom: '1.5pt solid #000000',
    paddingBottom: 15,
  },
  name: {
    ...getResumeFont('heading'),
    fontSize: 24,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#000000',
  },
  title: {
    ...getResumeFont('body'),
    fontSize: 14,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#333333',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  contact: {
    ...getResumeFont('contact'),
    fontSize: 9,
    color: '#555555',
  },
  separator: {
    marginHorizontal: 10,
    color: '#999999',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    ...getResumeFont('body'),
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
    color: '#000000',
    borderBottom: '1pt solid #000000',
    paddingBottom: 3,
  },
  experienceEntry: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  jobTitle: {
    ...getResumeFont('body'),
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
  },
  dateRange: {
    ...getResumeFont('contact'),
    fontSize: 10,
    color: '#555555',
    fontStyle: 'italic',
  },
  companyInfo: {
    ...getResumeFont('minor'),
    fontSize: 10,
    marginBottom: 6,
    color: '#333333',
    fontWeight: 'bold',
  },
  bulletList: {
    marginLeft: 10,
  },
  bulletPointContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletSymbol: {
    width: 10,
    fontSize: 10,
  },
  bulletContent: {
    flex: 1,
    ...getResumeFont('contact'),
    fontSize: 10,
    lineHeight: 1.4,
    color: '#333333',
  },
  bulletCategory: {
    fontWeight: 'bold',
    color: '#000000',
  },
  skillCategory: {
    marginBottom: 8,
  },
  skillTitle: {
    ...getResumeFont('minor'),
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  skillList: {
    ...getResumeFont('contact'),
    fontSize: 10,
    color: '#333333',
  },
  educationEntry: {
    marginBottom: 10,
  },
  languageEntry: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  languageName: {
    ...getResumeFont('contact'),
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 5,
  },
  languageLevel: {
    ...getResumeFont('contact'),
    fontSize: 10,
    color: '#555555',
  },
  referenceEntry: {
    marginBottom: 10,
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
          <Text style={styles.name}>{profile.header.name}</Text>
          <Text style={styles.title}>{profile.header.title}</Text>
          <View style={styles.contactRow}>
            <Text style={styles.contact}>{profile.header.location}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.contact}>{profile.header.phone}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.contact}>{profile.header.email}</Text>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contact}>{profile.header.linkedin}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.contact}>{profile.header.github}</Text>
          </View>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Summary</Text>
          <Text style={styles.bulletContent}>
            {tailoredContent.summary}
          </Text>
        </View>

        {/* Professional Experience Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Experience</Text>
          {profile.experience.map((exp, index) => (
            <View key={exp.id} style={styles.experienceEntry}>
              <View style={styles.headerRow}>
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
              <View style={styles.bulletList}>
                {exp.bullets.map((bullet, bulletIndex) => (
                  <View key={bullet.id} style={styles.bulletPointContainer}>
                    <Text style={styles.bulletSymbol}>•</Text>
                    <Text style={styles.bulletContent}>
                      <Text style={styles.bulletCategory}>{bullet.categoryLabel}:</Text>
                      <Text> {bullet.description}</Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Education Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {profile.education.map((edu, index) => (
            <View key={edu.id} style={styles.educationEntry}>
              <View style={styles.headerRow}>
                <Text style={styles.jobTitle}>{edu.degree} in {edu.field}</Text>
                <Text style={styles.dateRange}>{edu.startDate} – {edu.endDate}</Text>
              </View>
              <Text style={styles.companyInfo}>{edu.institution}</Text>
              {edu.details && (
                <Text style={styles.bulletContent}>{edu.details}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Technical Skills Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Skills & Competencies</Text>
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
          <Text style={styles.sectionTitle}>Languages</Text>
          {profile.languages.map((lang, index) => (
            <View key={lang.id} style={styles.languageEntry}>
              <Text style={styles.languageName}>{lang.name}:</Text>
              <Text style={styles.languageLevel}>{lang.proficiency}</Text>
            </View>
          ))}
        </View>

        {/* References Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>References</Text>
          {profile.references.length > 0 ? (
            profile.references.map((ref, index) => (
              <View key={ref.id} style={styles.referenceEntry}>
                <Text style={styles.jobTitle}>{ref.name}</Text>
                <Text style={styles.companyInfo}>{ref.title}, {ref.company}</Text>
                <Text style={styles.contact}>{ref.email}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.contact}>Available upon request</Text>
          )}
        </View>
      </Page>
    </Document>
  );
};