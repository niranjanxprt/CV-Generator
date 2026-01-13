'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ResumeLayout } from '@/components/resume/ResumeLayout';
import { UserProfile, TailoredContent } from '@/types';
import { createTailoredContent } from '@/lib/cv-tailoring';
import { loadProfileFromLocalStorage } from '@/lib/storage';
import '../../../styles/resume.css';

export default function PrintCVPage() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tailoredContent, setTailoredContent] = useState<TailoredContent | null>(null);
  const [loading, setLoading] = useState(true);

  const language = (searchParams.get('lang') as 'en' | 'de') || 'en';

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load profile using the updated storage utility that includes photo
        const storedProfile = loadProfileFromLocalStorage();
        if (!storedProfile) {
          throw new Error('No profile found');
        }

        setProfile(storedProfile);

        // Get job analysis from URL params or localStorage
        let jobAnalysis;
        const jobAnalysisParam = searchParams.get('jobAnalysis');
        
        if (jobAnalysisParam) {
          jobAnalysis = JSON.parse(jobAnalysisParam);
        } else {
          const storedJobAnalysis = localStorage.getItem('currentJobAnalysis');
          jobAnalysis = storedJobAnalysis 
            ? JSON.parse(storedJobAnalysis)
            : {
                jobTitle: 'Training Infrastructure Engineer',
                companyName: 'DeepRec.ai',
                mustHaveKeywords: ['training', 'GPU', 'optimising', 'workloads', 'memory', 'parallelism', 'distributed training', 'SLURM', 'PyTorch'],
                preferredKeywords: ['experiment tracking', 'model versioning', 'data loading', 'checkpointing', 'clusters', 'precision trade-offs', 'hardware behaviour'],
                niceToHaveKeywords: ['custom GPU kernels', 'diffusion models', 'autoregressive models', 'VAST', 'object storage'],
                languageRequirement: language === 'de' ? 'German' : 'English'
              };
        }

        // Create tailored content with smart distribution
        const tailored = await createTailoredContent(storedProfile, jobAnalysis);
        setTailoredContent(tailored);

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [language, searchParams]);

  useEffect(() => {
    // Auto-trigger print dialog after content loads
    if (!loading && profile && tailoredContent) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [loading, profile, tailoredContent]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div>Loading optimized CV for printing...</div>
      </div>
    );
  }

  if (!profile || !tailoredContent) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div>
          <h2>Error Loading CV</h2>
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
      
      <ResumeLayout 
        profile={profile} 
        tailoredContent={tailoredContent} 
        language={language}
      />
    </>
  );
}