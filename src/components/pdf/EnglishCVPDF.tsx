import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { UserProfile, TailoredContent } from '@/types';

// Register fonts with fallbacks
Font.register({
  family: 'Helvetica',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-UFVZ0e.ttf',
      fontWeight: 'normal'
    },
    {
      src: 'https://fonts.gstatic.com/s/opensans/v18/mem5YaGs126MiZpBA-UN7rgOUuhp.ttf',
      fontWeight: 'bold'
    },
    {
      src: 'https://fonts.gstatic.com/s/opensans/v18/mem6YaGs126MiZpBA-UFUK0Zdc1AAw.ttf',
      fontWeight: 'normal',
      fontStyle: 'italic'
    }
  ]
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9, // Further reduced for more content
    paddingTop: 35, // Reduced margins
    paddingBottom: 35,
    paddingHorizontal: 35,
    lineHeight: 1.2, // Tighter line spacing
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
    fontSize: 20, // Smaller name
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#2c3e50',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 12, // Smaller title
    marginBottom: 6,
    color: '#34495e',
    fontWeight: 'bold',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 3,
  },
  contact: {
    fontSize: 8, // Smaller contact info
    color: '#7f8c8d',
    marginHorizontal: 4,
  },
  section: {
    marginBottom: 12, // Tighter sections
  },
  sectionTitle: {
    fontSize: 11, // Smaller section titles
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
    fontSize: 10, // Smaller job titles
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  dateRange: {
    fontSize: 8, // Smaller dates
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  companyInfo: {
    fontSize: 9, // Smaller company info
    marginBottom: 4,
    color: '#34495e',
    fontWeight: 'bold',
  },
  bulletPoint: {
    fontSize: 8, // Smaller bullets for more content
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
    fontSize: 9, // Smaller skill titles
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#2c3e50',
  },
  skillList: {
    fontSize: 8, // Smaller skill lists
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
    fontSize: 9, // Smaller degree text
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  institution: {
    fontSize: 8, // Smaller institution text
    color: '#34495e',
    marginBottom: 2,
  },
  languageEntry: {
    marginBottom: 4, // Tighter languages
    paddingLeft: 2,
  },
  languageName: {
    fontSize: 8, // Smaller language text
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  languageLevel: {
    fontSize: 8,
    color: '#34495e',
  },
  referenceEntry: {
    marginBottom: 8, // Tighter references
    paddingLeft: 2,
  },
  referenceName: {
    fontSize: 9, // Smaller reference text
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 1,
  },
  referenceTitle: {
    fontSize: 8,
    color: '#34495e',
    marginBottom: 1,
  },
  referenceContact: {
    fontSize: 8,
    color: '#7f8c8d',
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
          <Text style={{ fontSize: 8, lineHeight: 1.3, color: '#2c3e50' }}>
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
            <Text style={{ fontSize: 11, color: '#7f8c8d', paddingLeft: 5 }}>
              Available upon request
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
};