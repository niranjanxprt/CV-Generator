'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PrintableCoverLetter } from '@/components/print/PrintableCoverLetter';
import { UserProfile, JobAnalysis } from '@/types';
import { generateCoverLetter } from '@/lib/content-generation';
import { createTailoredContent } from '@/lib/cv-tailoring';
import '../../../styles/print-cover-letter.css';

export default function PrintCoverLetterPage() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const language = (searchParams.get('lang') as 'en' | 'de') || 'en';

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get profile from localStorage using the correct key and structure
        const storedProfile = localStorage.getItem('cv-generator-profile');
        if (!storedProfile) {
          throw new Error('No profile found');
        }

        const storedData = JSON.parse(storedProfile);
        const parsedProfile: UserProfile = storedData.profile || storedData; // Handle both formats
        setProfile(parsedProfile);

        // Get job analysis from localStorage or create default
        const storedJobAnalysis = localStorage.getItem('currentJobAnalysis');
        const parsedJobAnalysis = storedJobAnalysis 
          ? JSON.parse(storedJobAnalysis)
          : {
              jobTitle: 'Software Developer',
              companyName: 'Company',
              mustHaveKeywords: [],
              preferredKeywords: [],
              niceToHaveKeywords: [],
              languageRequirement: language === 'de' ? 'German' : 'English'
            };

        setJobAnalysis(parsedJobAnalysis);

        // Generate cover letter content
        const tailoredContent = await createTailoredContent(parsedProfile, parsedJobAnalysis);
        const coverLetterContent = await generateCoverLetter(
          parsedProfile,
          parsedJobAnalysis,
          tailoredContent,
          language === 'de' ? 'German' : 'English'
        );

        setContent(coverLetterContent);

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [language]);

  useEffect(() => {
    // Auto-trigger print dialog after content loads
    if (!loading && profile && jobAnalysis && content) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [loading, profile, jobAnalysis, content]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div>Loading cover letter for printing...</div>
      </div>
    );
  }

  if (!profile || !jobAnalysis || !content) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div>
          <h2>Error Loading Cover Letter</h2>
          <p>Please go back to the CV generator and try again.</p>
          <button 
            onClick={() => window.history.back()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="no-print" style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        zIndex: 1000,
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <button 
          onClick={() => window.print()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '8px'
          }}
        >
          Print / Save as PDF
        </button>
        <button 
          onClick={() => window.history.back()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
      </div>
      
      <PrintableCoverLetter 
        profile={profile} 
        jobAnalysis={jobAnalysis}
        content={content}
        language={language}
      />
    </>
  );
}