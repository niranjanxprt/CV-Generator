'use client';

import React, { useEffect, useState } from 'react';
import { ResumeLayout } from '@/components/resume/ResumeLayout';
import { UserProfile, TailoredContent } from '@/types';
import { createTailoredContent } from '@/lib/cv-tailoring';
import { enforceCVPageLimit } from '@/lib/pdf-generation';
import { loadProfileFromLocalStorage } from '@/lib/storage';
import '../../styles/resume.css';

export default function DebugCVPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tailoredContent, setTailoredContent] = useState<TailoredContent | null>(null);
  const [optimizedProfile, setOptimizedProfile] = useState<UserProfile | null>(null);
  const [optimizedContent, setOptimizedContent] = useState<TailoredContent | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load profile
        const storedProfile = loadProfileFromLocalStorage();
        if (!storedProfile) {
          throw new Error('No profile found');
        }

        setProfile(storedProfile);

        // Create mock job analysis
        const jobAnalysis = {
          jobTitle: 'Training Infrastructure Engineer',
          companyName: 'DeepRec.ai',
          mustHaveKeywords: ['training', 'GPU', 'optimising', 'workloads', 'memory', 'parallelism', 'distributed training', 'SLURM', 'PyTorch'],
          preferredKeywords: ['experiment tracking', 'model versioning', 'data loading', 'checkpointing', 'clusters', 'precision trade-offs'],
          niceToHaveKeywords: ['custom GPU kernels', 'diffusion models', 'autoregressive models', 'VAST', 'object storage'],
          languageRequirement: 'English'
        };

        // Create tailored content
        const tailored = await createTailoredContent(storedProfile, jobAnalysis);
        setTailoredContent(tailored);

        // Apply page limit optimization
        const optimized = enforceCVPageLimit(storedProfile, tailored, 2);
        setOptimizedProfile(optimized.profile);
        setOptimizedContent(optimized.tailoredContent);
        setWarnings(optimized.warnings);

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading CV debug...</div>;
  }

  if (!profile || !tailoredContent || !optimizedProfile || !optimizedContent) {
    return <div style={{ padding: '20px' }}>Error loading profile data.</div>;
  }

  const originalBullets = profile.experience.reduce((sum, exp) => sum + exp.bullets.length, 0);
  const optimizedBullets = optimizedProfile.experience.reduce((sum, exp) => sum + exp.bullets.length, 0);

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
        maxWidth: '350px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>CV Debug Info</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Original Content:</strong><br/>
          • Experiences: {profile.experience.length}<br/>
          • Total Bullets: {originalBullets}<br/>
          • Skills: {profile.skills.length} categories<br/>
          • Summary: {profile.summary.length} chars<br/>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>Optimized Content:</strong><br/>
          • Experiences: {optimizedProfile.experience.length}<br/>
          • Total Bullets: {optimizedBullets}<br/>
          • Skills: {optimizedContent.reorderedSkills.length} categories<br/>
          • Summary: {optimizedContent.summary.length} chars<br/>
          • Match Score: {optimizedContent.matchScore}%<br/>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>Bullet Distribution:</strong><br/>
          {optimizedProfile.experience.map((exp, i) => (
            <div key={i}>• Exp {i+1}: {exp.bullets.length} bullets</div>
          ))}
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>Warnings:</strong><br/>
          {warnings.map((warning, i) => (
            <div key={i} style={{ fontSize: '10px', color: '#666' }}>• {warning}</div>
          ))}
        </div>

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
        </div>
      </div>
      
      <ResumeLayout 
        profile={optimizedProfile} 
        tailoredContent={optimizedContent} 
        language="en"
      />
    </>
  );
}