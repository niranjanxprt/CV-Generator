'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const profileData = {
    header: {
        name: "Niranjan Thimmappa",
        title: "Technical Domain Expert | AI Solutions & Customer Success",
        location: "Berlin, Germany",
        phone: "+49 176 3230 2301",
        email: "thimmappaniranjan@gmail.com",
        linkedin: "linkedin.com/in/niranjanthimmappa",
        github: "github.com/niranjanxprt",
        photo: "https://www.niranjanthimmappa.com/images/niranjan.webp"
    },
    summary: "Technical domain expert with hands-on experience bridging AI/ML technology and customer success in enterprise environments. At BuildingMinds, led customer-facing AI project delivery including POCs, onboarding, integrations, and use case co-development—achieving 100% project success rate.",
    experience: [
        {
            id: "exp-1",
            jobTitle: "Solution Architect | Customer Project Delivery & AI Solutions",
            company: "BuildingMinds GmbH",
            location: "Berlin",
            startDate: "10/2023",
            endDate: "Present",
            bullets: [
                { id: "b1-1", categoryLabel: "Revenue Growth", description: "Identified upsell opportunities, prepared business cases for platform expansion, and supported account executives with technical deep-dives." },
                { id: "b1-2", categoryLabel: "Project Leadership", description: "Led 20+ customer POCs, onboarding projects, and technical integrations for enterprise clients across EMEA (avg. value €50,000+)." },
                { id: "b1-3", categoryLabel: "Collaboration", description: "Served as bridge between commercial, technical, and product teams, sharing customer insights and market trends." },
                { id: "b1-4", categoryLabel: "Innovation", description: "Worked closely with engineering to identify new use cases and prioritize feature development based on customer feedback." }
            ]
        },
        {
            id: "exp-2",
            jobTitle: "Account Manager | Technical Customer Engagement",
            company: "Energenious GmbH",
            location: "Berlin",
            startDate: "04/2023",
            endDate: "09/2023",
            bullets: [
                { id: "b2-1", categoryLabel: "Strategy", description: "Analyzed customer workflows and translated technical capabilities into value propositions." },
                { id: "b2-2", categoryLabel: "Engagement", description: "Engaged with renewable energy customers to demonstrate technical solutions combining hardware and software optimization." }
            ]
        },
        {
            id: "exp-3",
            jobTitle: "Working Student | Analytics & Technical Systems",
            company: "GE Power Conversion GmbH",
            location: "Berlin",
            startDate: "01/2022",
            endDate: "03/2023",
            bullets: [
                { id: "b3-1", categoryLabel: "Process", description: "Navigated complex organizational structures and quality management systems at global industrial leader GE." },
                { id: "b3-2", categoryLabel: "Intelligence", description: "Conducted competitive analysis and identified strategic opportunities worth €2M+ through market research." },
                { id: "b3-3", categoryLabel: "Analytics", description: "Built Salesforce-based analytics dashboards, improving forecast accuracy by 30%." }
            ]
        },
        {
            id: "exp-4",
            jobTitle: "Technical Sales Engineer | Customer Solutions",
            company: "Arabcal Technical Solutions LLC",
            location: "Dubai",
            startDate: "03/2014",
            endDate: "08/2019",
            bullets: [
                { id: "b4-1", categoryLabel: "Success", description: "Built long-term customer relationships through consultative approach and post-sale support." },
                { id: "b4-2", categoryLabel: "Delivery", description: "Delivered 100+ technical projects for major industrial OEMs (Eaton, GE, ABB) managing €5M+ annual pipeline." }
            ]
        }
    ],
    education: [
        {
            id: "edu-1",
            degree: "MBA in Energy Management",
            field: "Energy Management",
            institution: "Technical University of Berlin (TU Berlin)",
            startDate: "09/2019",
            endDate: "03/2023"
        },
        {
            id: "edu-2",
            degree: "B.Tech in Electrical & Electronics Engineering",
            field: "Electrical & Electronics Engineering",
            institution: "SCMS School of Engineering",
            startDate: "08/2009",
            endDate: "05/2013"
        }
    ],
    skills: [
        {
            id: "s1",
            name: "ML Training Infrastructure",
            skills: [
                { name: "Training Pipeline", description: "", keywords: [] },
                { name: "Experiment Tracking", description: "", keywords: [] },
                { name: "Custom GPU Kernels", description: "", keywords: [] }
            ]
        },
        {
            id: "s2",
            name: "Deep Learning Models",
            skills: [
                { name: "Attention Mechanisms", description: "", keywords: [] },
                { name: "Diffusion Models", description: "", keywords: [] },
                { name: "PyTorch", description: "", keywords: [] }
            ]
        }
    ],
    languages: [
        { id: "l1", name: "English", proficiency: "C1 - Fluent" },
        { id: "l2", name: "German", proficiency: "B2 - Professional" }
    ],
    references: [
        {
            id: "r1",
            name: "Tobias Ungermanns",
            title: "Head of Solution Design",
            company: "BuildingMinds GmbH",
            email: "tobias.ungermanns@buildingminds.com"
        }
    ]
};

export default function ImportPage() {
    const router = useRouter();
    const [status, setStatus] = useState<'idle' | 'importing' | 'done'>('idle');

    const handleImport = () => {
        setStatus('importing');
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        localStorage.setItem('profilePhoto', profileData.header.photo);

        setTimeout(() => {
            setStatus('done');
            router.push('/profile');
        }, 1000);
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle>Import Niranjan's Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">
                        Click the button below to automatically load Niranjan Thimmappa's CV data into the application.
                    </p>
                    <Button
                        onClick={handleImport}
                        className="w-full"
                        disabled={status !== 'idle'}
                    >
                        {status === 'idle' && 'Import Profile Data'}
                        {status === 'importing' && 'Importing...'}
                        {status === 'done' && 'Redirecting...'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
