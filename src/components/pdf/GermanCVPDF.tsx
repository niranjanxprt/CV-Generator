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
              {exp.bullets.map((bullet, bulletIndex) => (
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