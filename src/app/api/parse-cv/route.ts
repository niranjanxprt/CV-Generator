import { NextRequest, NextResponse } from 'next/server';

// Server-side file validation
function validateCVFile(file: File): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (file.size > maxSize) {
    errors.push(`File too large. Maximum size is 10MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB`);
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`Unsupported file type. Please upload PDF, DOC, or DOCX files.`);
  }

  if (file.name.length > 255) {
    errors.push('Filename too long. Please rename the file.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateCVFile(file);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid file', details: validation.errors },
        { status: 400 }
      );
    }

    // For now, return a mock response since we can't use pdf-parse in the browser
    // In a real implementation, this would use server-side libraries
    const mockExtractedText = `
      John Doe
      Senior Software Engineer
      Berlin, Germany
      +49 123 456 7890
      john.doe@example.com
      linkedin.com/in/johndoe
      github.com/johndoe

      Professional Summary:
      Experienced software engineer with 5+ years of experience in full-stack development.
      Specialized in React, Node.js, and cloud technologies.

      Work Experience:
      Senior Software Engineer | Tech Company GmbH | Berlin | 01/2020 - Present
      - Developed scalable web applications using React and Node.js
      - Led a team of 3 developers on multiple projects
      - Implemented CI/CD pipelines reducing deployment time by 50%

      Education:
      Master of Science in Computer Science | Technical University of Berlin | 09/2015 - 07/2017

      Skills:
      Programming Languages: JavaScript, TypeScript, Python, Java
      Frameworks: React, Node.js, Express, Next.js
      Databases: PostgreSQL, MongoDB, Redis

      Languages:
      German - Native
      English - Fluent (C2)
    `;

    // Mock parsing result
    const mockParsedProfile = {
      header: {
        name: 'John Doe',
        title: 'Senior Software Engineer',
        location: 'Berlin, Germany',
        phone: '+49 123 456 7890',
        email: 'john.doe@example.com',
        linkedin: 'linkedin.com/in/johndoe',
        github: 'github.com/johndoe'
      },
      summary: 'Experienced software engineer with 5+ years of experience in full-stack development. Specialized in React, Node.js, and cloud technologies.',
      experience: [
        {
          id: crypto.randomUUID(),
          jobTitle: 'Senior Software Engineer',
          company: 'Tech Company GmbH',
          location: 'Berlin',
          startDate: '01/2020',
          endDate: 'Present',
          bullets: [
            {
              id: crypto.randomUUID(),
              categoryLabel: 'Web Development',
              description: 'Developed scalable web applications using React and Node.js'
            },
            {
              id: crypto.randomUUID(),
              categoryLabel: 'Team Leadership',
              description: 'Led a team of 3 developers on multiple projects'
            },
            {
              id: crypto.randomUUID(),
              categoryLabel: 'DevOps',
              description: 'Implemented CI/CD pipelines reducing deployment time by 50%'
            }
          ]
        }
      ],
      education: [
        {
          id: crypto.randomUUID(),
          degree: 'Master of Science',
          field: 'Computer Science',
          institution: 'Technical University of Berlin',
          startDate: '09/2015',
          endDate: '07/2017'
        }
      ],
      skills: [
        {
          id: crypto.randomUUID(),
          name: 'Programming Languages',
          skills: [
            { name: 'JavaScript', description: 'Advanced proficiency', keywords: [] },
            { name: 'TypeScript', description: 'Advanced proficiency', keywords: [] },
            { name: 'Python', description: 'Intermediate proficiency', keywords: [] }
          ]
        },
        {
          id: crypto.randomUUID(),
          name: 'Frameworks',
          skills: [
            { name: 'React', description: 'Expert level', keywords: [] },
            { name: 'Node.js', description: 'Advanced proficiency', keywords: [] },
            { name: 'Next.js', description: 'Advanced proficiency', keywords: [] }
          ]
        }
      ],
      languages: [
        {
          id: crypto.randomUUID(),
          name: 'German',
          proficiency: 'Native'
        },
        {
          id: crypto.randomUUID(),
          name: 'English',
          proficiency: 'Fluent (C2)'
        }
      ],
      references: []
    };

    return NextResponse.json({
      success: true,
      extractedText: mockExtractedText,
      parsedProfile: mockParsedProfile,
      confidence: 85,
      warnings: ['This is a mock parsing result for demonstration purposes'],
      errors: []
    });

  } catch (error) {
    console.error('CV parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse CV', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}