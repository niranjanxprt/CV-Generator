import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { UserProfile, TailoredContent } from '@/types';

// Register fonts (in a real app, you'd load actual font files)
Font.register({
  family: 'Helvetica',
  src: 'https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-UFVZ0e.ttf'
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 35,
    paddingBottom: 35,
    paddingHorizontal: 35,
    lineHeight: 1.15,
  },
  header: {
    marginBottom: 20,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  title: {
    fontSize: 12,
    marginBottom: 5,
  },
  contact: {
    fontSize: 10,
    marginBottom: 3,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    borderBottom: '1pt solid black',
    paddingBottom: 2,
  },
  experienceEntry: {
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  companyInfo: {
    fontSize: 10,
    marginBottom: 5,
  },
  bulletPoint: {
    fontSize: 10,
    marginBottom: 3,
    marginLeft: 10,
  },
  bulletCategory: {
    fontWeight: 'bold',
  },
  skillCategory: {
    marginBottom: 8,
  },
  skillTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  skillList: {
    fontSize: 10,
    marginLeft: 10,
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
          <Text style={styles.name}>{profile.header.name}</Text>
          <Text style={styles.title}>{profile.header.title}</Text>
          <Text style={styles.contact}>
            {profile.header.location} • {profile.header.phone} • {profile.header.email}
          </Text>
          <Text style={styles.contact}>
            {profile.header.linkedin} • {profile.header.github}
          </Text>
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