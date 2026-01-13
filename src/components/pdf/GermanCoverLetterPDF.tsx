import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { UserProfile, JobAnalysis } from '@/types';

// Register fonts
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
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 60,
    marginLeft: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    objectFit: 'cover',
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  title: {
    fontSize: 11,
    marginBottom: 3,
  },
  contact: {
    fontSize: 10,
    marginBottom: 2,
  },
  date: {
    fontSize: 10,
    marginBottom: 20,
    textAlign: 'right',
  },
  subject: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 10,
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 15,
    textAlign: 'justify',
    lineHeight: 1.4,
  },
  closing: {
    fontSize: 10,
    marginTop: 20,
    marginBottom: 40,
  },
  signature: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

interface GermanCoverLetterPDFProps {
  profile: UserProfile;
  jobAnalysis: JobAnalysis;
  content: string;
}

export const GermanCoverLetterPDF: React.FC<GermanCoverLetterPDFProps> = ({ 
  profile, 
  jobAnalysis, 
  content 
}) => {
  const currentDate = new Date().toLocaleDateString('de-DE');
  
  // Split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.name}>{profile.header.name}</Text>
            <Text style={styles.title}>{profile.header.title}</Text>
            <Text style={styles.contact}>{profile.header.location}</Text>
            <Text style={styles.contact}>
              {profile.header.phone} | {profile.header.email}
            </Text>
            <Text style={styles.contact}>
              {profile.header.linkedin} | {profile.header.github}
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

        {/* Date */}
        <Text style={styles.date}>{currentDate}</Text>

        {/* Company Address (if available) */}
        {jobAnalysis.companyName && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 10 }}>{jobAnalysis.companyName}</Text>
          </View>
        )}

        {/* Subject */}
        <Text style={styles.subject}>
          Bewerbung als {jobAnalysis.jobTitle}
        </Text>

        {/* Content */}
        <View>
          {paragraphs.map((paragraph, index) => {
            // Skip header information that's already displayed
            if (paragraph.includes(profile.header.name) || 
                paragraph.includes(profile.header.title) ||
                paragraph.includes(currentDate) ||
                paragraph.includes('Bewerbung als')) {
              return null;
            }
            
            return (
              <Text key={index} style={styles.paragraph}>
                {paragraph.trim()}
              </Text>
            );
          })}
        </View>

        {/* Closing */}
        <View style={styles.closing}>
          <Text style={{ marginBottom: 10 }}>Mit freundlichen Grüßen</Text>
          <Text style={styles.signature}>{profile.header.name}</Text>
        </View>
      </Page>
    </Document>
  );
};