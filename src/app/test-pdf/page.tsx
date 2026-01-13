'use client';

import React, { useEffect, useState } from 'react';
import { ResumeLayout } from '@/components/resume/ResumeLayout';
import { UserProfile, TailoredContent } from '@/types';
import { createTailoredContent } from '@/lib/cv-tailoring';
import { loadProfileFromLocalStorage } from '@/lib/storage';
import '../../styles/resume.css';

export default function TestPDFPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tailoredContent, setTailoredContent] = useState<TailoredContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageInfo, setPageInfo] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load profile
        const storedProfile = loadProfileFromLocalStorage();
        if (!storedProfile) {
          throw new Error('No profile found');
        }

        setProfile(storedProfile);

        // Create mock job analysis for Training Infrastructure Engineer
        const jobAnalysis = {
          jobTitle: 'Training Infrastructure Engineer',
          companyName: 'DeepRec.ai',
          mustHaveKeywords: ['training', 'GPU', 'optimising', 'workloads', 'memory', 'parallelism', 'distributed training', 'SLURM', 'PyTorch'],
          preferredKeywords: ['experiment tracking', 'model versioning', 'data loading', 'checkpointing', 'clusters', 'precision trade-offs', 'hardware behaviour'],
          niceToHaveKeywords: ['custom GPU kernels', 'diffusion models', 'autoregressive models', 'VAST', 'object storage'],
          languageRequirement: 'English'
        };

        // Create tailored content
        const tailored = await createTailoredContent(storedProfile, jobAnalysis);
        setTailoredContent(tailored);

        // Calculate content metrics
        const totalBullets = storedProfile.experience.reduce((sum, exp) => sum + exp.bullets.length, 0);
        const totalSkills = storedProfile.skills.reduce((sum, cat) => sum + cat.skills.length, 0);
        
        setPageInfo(`
          Content Analysis:
          - Experiences: ${storedProfile.experience.length}
          - Total Bullets: ${totalBullets}
          - Skill Categories: ${storedProfile.skills.length}
          - Total Skills: ${totalSkills}
          - Education: ${storedProfile.education.length}
          - Languages: ${storedProfile.languages.length}
          - References: ${storedProfile.references.length}
          - Summary Length: ${tailored.summary.length} chars
          - Match Score: ${tailored.matchScore}%
        `);

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div>Loading CV test...</div>
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
          <h2>Error Loading Profile</h2>
          <p>Please go to the profile page first to set up your data.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="no-print" style={{ 
        position: 'fixed', 
        top: '10px', 
        left: '10px', 
        zIndex: 1000,
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '300px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>PDF Test Page</h3>
        <pre style={{ margin: '0 0 10px 0', fontSize: '11px' }}>{pageInfo}</pre>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.print()}
            style={{
              padding: '6px 12px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Print/PDF
          </button>
          <button 
            onClick={() => window.location.href = '/profile'}
            style={{
              padding: '6px 12px',
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Profile
          </button>
          <button 
            onClick={() => window.location.href = '/generate'}
            style={{
              padding: '6px 12px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Generate
          </button>
        </div>
      </div>
      
      <ResumeLayout 
        profile={profile} 
        tailoredContent={tailoredContent} 
        language="en"
      />
    </>
  );
}