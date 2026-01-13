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
    fontSize: 11,
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 50,
    lineHeight: 1.4,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '3pt solid #2c3e50',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 80,
    marginLeft: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    objectFit: 'cover',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
    letterSpacing: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 12,
    color: '#34495e',
    fontWeight: 'bold',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  contact: {
    fontSize: 11,
    color: '#7f8c8d',
    marginHorizontal: 8,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    color: '#2c3e50',
    borderBottom: '2pt solid #3498db',
    paddingBottom: 4,
    letterSpacing: 0.5,
  },
  experienceEntry: {
    marginBottom: 20,
    paddingLeft: 5,
  },
  jobTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  dateRange: {
    fontSize: 11,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  companyInfo: {
    fontSize: 12,
    marginBottom: 8,
    color: '#34495e',
    fontWeight: 'bold',
  },
  bulletPoint: {
    fontSize: 11,
    marginBottom: 6,
    marginLeft: 15,
    lineHeight: 1.5,
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
    marginBottom: 12,
    paddingLeft: 5,
  },
  skillTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#2c3e50',
  },
  skillList: {
    fontSize: 11,
    marginLeft: 15,
    lineHeight: 1.4,
    color: '#34495e',
  },
  educationEntry: {
    marginBottom: 15,
    paddingLeft: 5,
  },
  degreeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  degree: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  institution: {
    fontSize: 11,
    color: '#34495e',
    marginBottom: 4,
  },
  languageEntry: {
    marginBottom: 8,
    paddingLeft: 5,
  },
  languageName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  languageLevel: {
    fontSize: 11,
    color: '#34495e',
  },
  referenceEntry: {
    marginBottom: 15,
    paddingLeft: 5,
  },
  referenceName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 3,
  },
  referenceTitle: {
    fontSize: 11,
    color: '#34495e',
    marginBottom: 2,
  },
  referenceContact: {
    fontSize: 11,
    color: '#7f8c8d',
  },
});

interface GermanCVPDFProps {
  profile: UserProfile;
  tailoredContent: TailoredContent;
}

export const GermanCVPDF: React.FC<GermanCVPDFProps> = ({ profile, tailoredContent }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.name}>{profile.header.name}</Text>
            <Text style={styles.title}>{profile.header.title}</Text>
            <Text style={styles.contact}>
              {profile.header.location} • {profile.header.phone} • {profile.header.email}
            </Text>
            <Text style={styles.contact}>
              {profile.header.linkedin} • {profile.header.github}
            </Text>
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

        {/* Profil Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFIL</Text>
          <Text>{tailoredContent.summary}</Text>
        </View>

        {/* Berufserfahrung Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BERUFSERFAHRUNG</Text>
          {profile.experience.map((exp, index) => (
            <View key={exp.id} style={styles.experienceEntry}>
              <Text style={styles.jobTitle}>
                {exp.jobTitle}{exp.subtitle ? ` | ${exp.subtitle}` : ''}
              </Text>
              <Text style={styles.companyInfo}>
                {exp.company}, {exp.location}, {exp.startDate} – {exp.endDate}
              </Text>
              {exp.bullets.slice(0, 6).map((bullet, bulletIndex) => (
                <View key={bullet.id} style={styles.bulletPoint}>
                  <Text>
                    <Text style={styles.bulletCategory}>{bullet.categoryLabel}:</Text>
                    {' '}{bullet.description}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Ausbildung Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AUSBILDUNG</Text>
          {profile.education.map((edu, index) => (
            <View key={edu.id} style={{ marginBottom: 8 }}>
              <Text style={styles.jobTitle}>{edu.degree} in {edu.field}</Text>
              <Text style={styles.companyInfo}>
                {edu.institution}, {edu.startDate} – {edu.endDate}
              </Text>
              {edu.details && <Text>{edu.details}</Text>}
            </View>
          ))}
        </View>

        {/* Technische Fähigkeiten Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TECHNISCHE FÄHIGKEITEN & KOMPETENZEN</Text>
          {tailoredContent.reorderedSkills.map((category, index) => (
            <View key={category.id} style={styles.skillCategory}>
              <Text style={styles.skillTitle}>{category.name}:</Text>
              <Text style={styles.skillList}>
                {category.skills.map(skill => skill.name).join(', ')}
              </Text>
            </View>
          ))}
        </View>

        {/* Sprachkenntnisse Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SPRACHKENNTNISSE</Text>
          {profile.languages.map((lang, index) => (
            <Text key={lang.id} style={{ marginBottom: 3 }}>
              {lang.name}: {lang.proficiency}
            </Text>
          ))}
        </View>

        {/* Referenzen Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REFERENZEN</Text>
          {profile.references.length > 0 ? (
            profile.references.map((ref, index) => (
              <View key={ref.id} style={{ marginBottom: 8 }}>
                <Text style={styles.jobTitle}>{ref.name}</Text>
                <Text>{ref.title}, {ref.company}</Text>
                <Text>{ref.email}</Text>
              </View>
            ))
          ) : (
            <Text>Auf Anfrage verfügbar</Text>
          )}
        </View>
      </Page>
    </Document>
  );
};