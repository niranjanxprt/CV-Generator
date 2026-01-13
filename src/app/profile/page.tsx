'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserProfile } from '@/types';
import { saveProfileToLocalStorage, loadProfileFromLocalStorage } from '@/lib/storage';
import { CVImportComponent } from '@/components/CVImportComponent';
import { ProfileForm } from '@/components/ProfileForm';
import Link from 'next/link';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Default profile data based on Niranjan's CV
  const getDefaultProfile = (): UserProfile => ({
    header: {
      name: 'Niranjan Thimmappa',
      title: 'Technical Domain Expert | AI Solutions & Customer Success',
      location: 'Berlin, Germany',
      phone: '+49 176 3230 2301',
      email: 'thimmappaniranjan@gmail.com',
      linkedin: 'linkedin.com/in/niranjanthimmappa',
      github: 'github.com/niranjanxprt'
    },
    summary: 'Technical domain expert with hands-on experience bridging AI/ML technology and customer success in enterprise environments. At BuildingMinds, led customer-facing AI project delivery including POCs, onboarding, integrations, and use case co-development—achieving 100% project success rate and winning Digital Top 10 2025 award. Deep technical fluency with AI platforms (Azure AI Foundry), prompt engineering, Python automation, and cloud-native architectures, combined with ability to translate complex technical concepts for business stakeholders. Experience collaborating with engineering teams while serving as customer champion, identifying new use cases, and maximizing platform value. Background includes large company experience (GE), technical systems, and cross-functional project leadership. MBA provides business acumen for understanding customer ROI, competitive positioning, and revenue growth strategies. Eager to apply technical expertise and customer-focused mindset to transform MedTech compliance through AI, accelerate time-to-market for life-saving medical devices, and build domain excellence at REMATIQ. Based in Berlin, ready for 4 days/week office culture and immediate impact.',
    experience: [
      {
        id: crypto.randomUUID(),
        jobTitle: 'Solution Architect | Customer Project Delivery & AI Solutions',
        company: 'BuildingMinds GmbH',
        location: 'Berlin',
        startDate: '10/2023',
        endDate: 'Present',
        bullets: [
          {
            id: crypto.randomUUID(),
            categoryLabel: 'Customer Project Delivery & POC Leadership',
            description: 'Led 20+ customer POCs, onboarding projects, and technical integrations for enterprise clients across EMEA, achieving 100% success rate with average project value €50,000+. Served as primary technical expert guiding customers from evaluation through production deployment, translating complex AI capabilities into business value and measurable outcomes.'
          },
          {
            id: crypto.randomUUID(),
            categoryLabel: 'Use Case Co-Development & Value Maximization',
            description: 'Collaborated with customers to identify high-impact use cases, design solution architectures, and configure platform features for their specific needs. Achieved Digital Top 10 Project 2025 recognition by demonstrating 95% accuracy in AI-powered document extraction, showcasing ability to deliver exceptional customer results and build compelling success stories.'
          },
          {
            id: crypto.randomUUID(),
            categoryLabel: 'Product Innovation & Customer Feedback Loop',
            description: 'Worked closely with engineering and product teams to identify new use cases, prioritize feature development based on customer feedback, and design platform enhancements. Translated customer pain points into technical requirements, conducted feasibility assessments, and validated solutions through iterative testing.'
          },
          {
            id: crypto.randomUUID(),
            categoryLabel: 'Technical Expertise & Platform Mastery',
            description: 'Deep hands-on experience with AI/ML platforms (Azure AI Foundry), prompt engineering, Python development (FastAPI, asyncio, pandas), API integrations, and cloud architectures. Built production-grade AI applications, automated workflows, and data pipelines demonstrating strong technical foundation for understanding and explaining complex systems.'
          },
          {
            id: crypto.randomUUID(),
            categoryLabel: 'Cross-Functional Collaboration & Internal SME',
            description: 'Served as bridge between commercial, technical, and product teams, sharing customer insights, competitive intelligence, and market trends. Provided technical guidance to stakeholders, created documentation and training materials, and championed customer needs in internal discussions.'
          },
          {
            id: crypto.randomUUID(),
            categoryLabel: 'Revenue Growth & Customer Expansion',
            description: 'Identified upsell opportunities, prepared business cases for platform expansion, and supported account executives with technical deep-dives during sales cycles. Demonstrated ROI through data-driven analysis, customer testimonials, and quantified efficiency gains.'
          }
        ]
      },
      {
        id: crypto.randomUUID(),
        jobTitle: 'Account Manager | Technical Customer Engagement',
        company: 'Energenious GmbH (Climate-Tech Scale-up)',
        location: 'Berlin',
        startDate: '04/2023',
        endDate: '09/2023',
        bullets: [
          {
            id: crypto.randomUUID(),
            categoryLabel: 'Customer-Facing Technical Solutions',
            description: 'Engaged with renewable energy customers to understand requirements, conduct on-site consultations, and demonstrate technical solutions combining hardware and software optimization algorithms. Represented company at Smarter E Munich 2023, Europe\'s leading renewable energy trade show, generating qualified leads through technical presentations.'
          },
          {
            id: crypto.randomUUID(),
            categoryLabel: 'Use Case Development & Market Analysis',
            description: 'Analyzed customer workflows, identified optimization opportunities, and translated technical capabilities into customer value propositions. Gathered market intelligence on competitive solutions and emerging customer needs.'
          }
        ]
      },
      {
        id: crypto.randomUUID(),
        jobTitle: 'Working Student | Analytics & Technical Systems',
        company: 'GE Power Conversion GmbH (Global MedTech/Industrial Leader)',
        location: 'Berlin',
        startDate: '01/2022',
        endDate: '03/2023',
        bullets: [
          {
            id: crypto.randomUUID(),
            categoryLabel: 'Large Company Experience & Process Understanding',
            description: 'Gained firsthand experience navigating complex organizational structures, quality management systems, and regulatory-aware development processes at global industrial technology leader GE. Worked within established frameworks for technical documentation, validation procedures, and cross-functional collaboration typical of large regulated companies.'
          },
          {
            id: crypto.randomUUID(),
            categoryLabel: 'Data Analytics & Forecasting Systems',
            description: 'Built Salesforce-based analytics dashboards integrating hardware telemetry data, improving forecast accuracy by 30% through data-driven insights. Demonstrated ability to translate technical data into business intelligence and actionable recommendations for stakeholders.'
          },
          {
            id: crypto.randomUUID(),
            categoryLabel: 'Technical Specification & Market Intelligence',
            description: 'Conducted competitive analysis of emerging technologies, validated technical specifications for industrial systems, and identified strategic opportunities worth €2M+ through systematic market research and technology assessment.'
          }
        ]
      },
      {
        id: crypto.randomUUID(),
        jobTitle: 'Technical Sales Engineer | Customer Solutions',
        company: 'Arabcal Technical Solutions LLC',
        location: 'Dubai',
        startDate: '03/2014',
        endDate: '08/2019',
        bullets: [
          {
            id: crypto.randomUUID(),
            categoryLabel: 'Technical Project Delivery',
            description: 'Delivered 100+ technical projects for major industrial OEMs (Eaton, GE, ABB) and utility companies. Managed €5M+ annual pipeline, conducted technical consultations, designed integration solutions, and provided implementation support and training.'
          },
          {
            id: crypto.randomUUID(),
            categoryLabel: 'Customer Success & Account Management',
            description: 'Built long-term customer relationships through consultative approach, post-sale support, and continuous value delivery, driving repeat business and referrals.'
          }
        ]
      }
    ],
    education: [
      {
        id: crypto.randomUUID(),
        degree: 'MBA',
        field: 'Energy Management',
        institution: 'Technical University of Berlin (TU Berlin)',
        startDate: '09/2019',
        endDate: '03/2023'
      },
      {
        id: crypto.randomUUID(),
        degree: 'B.Tech',
        field: 'Electrical & Electronics Engineering',
        institution: 'SCMS School of Engineering',
        startDate: '08/2009',
        endDate: '05/2013'
      }
    ],
    skills: [
      {
        id: crypto.randomUUID(),
        name: 'AI & Technical Expertise',
        skills: [
          { name: 'Azure AI Foundry', description: 'Production experience with prompt engineering and model evaluation', keywords: ['azure', 'ai', 'foundry'] },
          { name: 'Python Development', description: 'FastAPI, asyncio, pandas for production AI systems', keywords: ['python', 'fastapi', 'pandas'] },
          { name: 'Cloud Architectures', description: 'Azure and AWS concepts for scalable solutions', keywords: ['cloud', 'azure', 'aws'] },
          { name: 'DevOps & Automation', description: 'Git, Docker, CI/CD pipelines, monitoring', keywords: ['devops', 'docker', 'git'] }
        ]
      },
      {
        id: crypto.randomUUID(),
        name: 'Customer-Facing & Domain Expertise',
        skills: [
          { name: 'POC Leadership', description: 'Project delivery, onboarding, integration management', keywords: ['poc', 'leadership'] },
          { name: 'Customer Success', description: 'Value maximization, platform adoption, training', keywords: ['customer', 'success'] },
          { name: 'Technical Communication', description: 'Complex concepts, executive presentations, documentation', keywords: ['communication', 'technical'] },
          { name: 'Domain Learning', description: 'Rapid expertise building, regulatory awareness', keywords: ['domain', 'learning'] }
        ]
      },
      {
        id: crypto.randomUUID(),
        name: 'Product & Business Development',
        skills: [
          { name: 'Product Innovation', description: 'Feature ideation, customer feedback synthesis', keywords: ['product', 'innovation'] },
          { name: 'Revenue Growth', description: 'Upsell identification, ROI demonstration', keywords: ['revenue', 'growth'] },
          { name: 'Market Analysis', description: 'Competitive intelligence, customer segmentation', keywords: ['market', 'analysis'] },
          { name: 'Strategic Thinking', description: 'MBA-level business acumen, positioning', keywords: ['strategy', 'business'] }
        ]
      },
      {
        id: crypto.randomUUID(),
        name: 'Collaboration & Execution',
        skills: [
          { name: 'Cross-Functional Leadership', description: 'Engineering, product, sales collaboration', keywords: ['collaboration', 'leadership'] },
          { name: 'Stakeholder Management', description: 'Multi-level communication, consensus building', keywords: ['stakeholder', 'management'] },
          { name: 'Execution Mentality', description: 'Hands-on problem-solving, ownership, results-driven', keywords: ['execution', 'problem-solving'] },
          { name: 'Adaptability', description: 'Fast learner, startup mindset, comfortable with ambiguity', keywords: ['adaptability', 'learning'] }
        ]
      }
    ],
    languages: [
      {
        id: crypto.randomUUID(),
        name: 'English',
        proficiency: 'C1 – Fluent (Native-level professional)'
      },
      {
        id: crypto.randomUUID(),
        name: 'German',
        proficiency: 'B2 – Professional Working Proficiency'
      }
    ],
    references: [
      {
        id: crypto.randomUUID(),
        name: 'Tobias Ungermanns',
        title: 'Head of Solution Design',
        company: 'BuildingMinds GmbH',
        email: 'tobias.ungermanns@buildingminds.com'
      }
    ]
  });

  useEffect(() => {
    // Load existing profile from localStorage or use default
    const savedProfile = loadProfileFromLocalStorage();
    if (savedProfile) {
      setProfile(savedProfile);
    } else {
      // Use default profile and save it
      const defaultProfile = getDefaultProfile();
      setProfile(defaultProfile);
      saveProfileToLocalStorage(defaultProfile);
    }

    // Set default profile photo
    const savedPhoto = localStorage.getItem('profilePhoto');
    if (!savedPhoto) {
      // Use the image from the HTML CV
      localStorage.setItem('profilePhoto', 'https://www.niranjanthimmappa.com/images/niranjan.webp');
    }

    setIsLoading(false);
  }, []);

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    saveProfileToLocalStorage(updatedProfile);
  };

  const handleCVImport = (importedProfile: Partial<UserProfile>) => {
    if (profile) {
      const mergedProfile: UserProfile = {
        header: { ...profile.header, ...importedProfile.header },
        summary: importedProfile.summary || profile.summary,
        experience: importedProfile.experience || profile.experience,
        education: importedProfile.education || profile.education,
        skills: importedProfile.skills || profile.skills,
        languages: importedProfile.languages || profile.languages,
        references: importedProfile.references || profile.references
      };
      handleProfileUpdate(mergedProfile);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Professional Profile</h1>
            <p className="text-gray-600 mt-2">
              Pre-loaded with professional CV data - edit and customize for different job applications
            </p>
          </div>
          <div className="flex space-x-4">
            <CVImportComponent onImportComplete={handleCVImport} />
            <Link href="/generate">
              <Button variant="outline">
                Continue to Generate →
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {profile && (
        <ProfileForm
          initialProfile={profile}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}