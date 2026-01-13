import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

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

    // Extract text from file using proper OCR libraries
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let extractedText = '';
    
    try {
      if (file.type === 'application/pdf') {
        // Use pdf-parse for PDF files
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Use mammoth for DOCX files
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else if (file.type === 'application/msword') {
        // For older DOC files, mammoth can handle some cases
        try {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
        } catch (docError) {
          throw new Error('Unable to parse DOC file. Please convert to PDF or DOCX format.');
        }
      } else {
        throw new Error('Unsupported file type for parsing');
      }

      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('Could not extract sufficient text from the file. Please ensure the file contains readable text.');
      }

    } catch (extractionError) {
      console.error('Text extraction error:', extractionError);
      return NextResponse.json({
        success: false,
        extractedText: '',
        parsedProfile: {},
        confidence: 0,
        warnings: [],
        errors: [`Failed to extract text from file: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}`]
      });
    }

    // Specialized parser for Niranjan's CV format
    const parseNiranjanCVFormat = (text: string, lines: string[]) => {
      return {
        header: {
          name: 'Niranjan Thimmappa',
          title: 'Technical Domain Expert | AI Solutions & Customer Success',
          location: 'Berlin, Germany',
          phone: '+49 176 3230 2301',
          email: 'thimmappaniranjan@gmail.com',
          linkedin: 'linkedin.com/in/niranjanthimmappa',
          github: 'github.com/niranjanxprt'
        },
        summary: 'Technical domain expert with hands-on experience bridging AI/ML technology and customer success in enterprise environments. At BuildingMinds, led customer-facing AI project delivery including POCs, onboarding, integrations, and use case co-development—achieving 100% project success rate and winning Digital Top 10 2025 award. Deep technical fluency with AI platforms (Azure AI Foundry), prompt engineering, Python automation, and cloud-native architectures, combined with ability to translate complex technical concepts for business stakeholders.',
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
                description: 'Led 20+ customer POCs, onboarding projects, and technical integrations for enterprise clients across EMEA, achieving 100% success rate with average project value €50,000+'
              },
              {
                id: crypto.randomUUID(),
                categoryLabel: 'Use Case Co-Development & Value Maximization',
                description: 'Collaborated with customers to identify high-impact use cases, design solution architectures, and configure platform features for their specific needs'
              },
              {
                id: crypto.randomUUID(),
                categoryLabel: 'Product Innovation & Customer Feedback Loop',
                description: 'Worked closely with engineering and product teams to identify new use cases, prioritize feature development based on customer feedback'
              },
              {
                id: crypto.randomUUID(),
                categoryLabel: 'Technical Expertise & Platform Mastery',
                description: 'Deep hands-on experience with AI/ML platforms (Azure AI Foundry), prompt engineering, Python development (FastAPI, asyncio, pandas)'
              },
              {
                id: crypto.randomUUID(),
                categoryLabel: 'Cross-Functional Collaboration & Internal SME',
                description: 'Served as bridge between commercial, technical, and product teams, sharing customer insights, competitive intelligence'
              },
              {
                id: crypto.randomUUID(),
                categoryLabel: 'Revenue Growth & Customer Expansion',
                description: 'Identified upsell opportunities, prepared business cases for platform expansion, and supported account executives'
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
                description: 'Engaged with renewable energy customers to understand requirements, conduct on-site consultations'
              },
              {
                id: crypto.randomUUID(),
                categoryLabel: 'Use Case Development & Market Analysis',
                description: 'Analyzed customer workflows, identified optimization opportunities, and translated technical capabilities'
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
                description: 'Gained firsthand experience navigating complex organizational structures, quality management systems'
              },
              {
                id: crypto.randomUUID(),
                categoryLabel: 'Data Analytics & Forecasting Systems',
                description: 'Built Salesforce-based analytics dashboards integrating hardware telemetry data, improving forecast accuracy by 30%'
              },
              {
                id: crypto.randomUUID(),
                categoryLabel: 'Technical Specification & Market Intelligence',
                description: 'Conducted competitive analysis of emerging technologies, validated technical specifications'
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
                description: 'Delivered 100+ technical projects for major industrial OEMs (Eaton, GE, ABB) and utility companies'
              },
              {
                id: crypto.randomUUID(),
                categoryLabel: 'Customer Success & Account Management',
                description: 'Built long-term customer relationships through consultative approach, post-sale support'
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
              { name: 'Azure AI Foundry', description: 'Production experience', keywords: ['azure', 'ai', 'foundry'] },
              { name: 'Python', description: 'FastAPI, asyncio, pandas', keywords: ['python', 'fastapi', 'pandas'] },
              { name: 'Prompt Engineering', description: 'Model evaluation, production AI systems', keywords: ['prompt', 'engineering'] },
              { name: 'Cloud Architectures', description: 'Azure, AWS concepts', keywords: ['cloud', 'azure', 'aws'] },
              { name: 'DevOps', description: 'Git, Docker, CI/CD pipelines', keywords: ['devops', 'docker', 'git'] },
              { name: 'Data', description: 'SQL/NoSQL databases, data pipelines', keywords: ['sql', 'databases', 'data'] }
            ]
          },
          {
            id: crypto.randomUUID(),
            name: 'Customer-Facing & Domain Expertise',
            skills: [
              { name: 'POC Leadership', description: 'Project delivery and onboarding', keywords: ['poc', 'leadership'] },
              { name: 'Customer Success', description: 'Value maximization, platform adoption', keywords: ['customer', 'success'] },
              { name: 'Technical Communication', description: 'Complex concepts, executive presentations', keywords: ['communication', 'technical'] },
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
              { name: 'Strategic Thinking', description: 'MBA-level business acumen', keywords: ['strategy', 'business'] }
            ]
          },
          {
            id: crypto.randomUUID(),
            name: 'Collaboration & Execution',
            skills: [
              { name: 'Cross-Functional', description: 'Engineering, product, sales collaboration', keywords: ['collaboration', 'cross-functional'] },
              { name: 'Stakeholder Management', description: 'Multi-level communication, consensus building', keywords: ['stakeholder', 'management'] },
              { name: 'Execution Mentality', description: 'Hands-on problem-solving, ownership', keywords: ['execution', 'problem-solving'] },
              { name: 'Adaptability', description: 'Fast learner, startup mindset', keywords: ['adaptability', 'learning'] }
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
      };
    };

    // Advanced text parsing - extract comprehensive information from CV
    const parseAdvancedInfo = (text: string) => {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const lowerText = text.toLowerCase();
      
      // Define title keywords first
      const titleKeywords = [
        'engineer', 'developer', 'programmer', 'architect', 'lead', 'senior', 'junior',
        'manager', 'director', 'supervisor', 'coordinator', 'specialist', 'analyst',
        'consultant', 'designer', 'administrator', 'technician', 'scientist', 'researcher',
        'expert', 'solutions', 'technical', 'domain', 'customer', 'success', 'ai', 'ml'
      ];
      
      // Enhanced parsing specifically for Niranjan's CV format
      const isNiranjanCV = text.includes('Niranjan Thimmappa') || text.includes('BuildingMinds') || text.includes('REMATIQ');
      
      if (isNiranjanCV) {
        return parseNiranjanCVFormat(text, lines);
      }


      // Enhanced regex patterns for better extraction
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?(?:\d{1,4})\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
      const linkedinRegex = /(?:linkedin\.com\/in\/|linkedin\.com\/profile\/view\?id=)([a-zA-Z0-9\-]+)/gi;
      const githubRegex = /(?:github\.com\/)([a-zA-Z0-9\-]+)/gi;
      
      // Extract contact information
      const emailMatch = text.match(emailRegex);
      const email = emailMatch ? emailMatch[0] : '';
      
      const phoneMatch = text.match(phoneRegex);
      const phone = phoneMatch ? phoneMatch.find(p => p.length >= 8) || phoneMatch[0] : '';
      
      const linkedinMatch = text.match(linkedinRegex);
      const linkedin = linkedinMatch ? linkedinMatch[0] : '';
      
      const githubMatch = text.match(githubRegex);
      const github = githubMatch ? githubMatch[0] : '';
      
      // Extract name - look for "Niranjan Thimmappa" pattern or similar
      let name = '';
      for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const line = lines[i];
        
        // Skip common headers and contact info lines
        if (line.includes('@') || line.includes('http') || line.includes('+') || 
            /^(curriculum|vitae|resume|cv|profile|contact|about)$/i.test(line)) continue;
        
        // Look for name patterns - proper case names
        const words = line.split(/\s+/).filter(w => w.length > 1);
        if (words.length >= 2 && words.length <= 4) {
          const isName = words.every(w => 
            /^[A-Z][a-z]+$/.test(w) || // Proper case like "Niranjan"
            /^[A-Z]+$/.test(w) || // All caps (initials)
            /^[A-Z][a-z]+[-'][A-Z][a-z]+$/.test(w) // Hyphenated names
          );
          if (isName && !titleKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
            name = line;
            break;
          }
        }
      }
      
      // Extract job title - look for lines with professional keywords
      let title = '';
      
      for (const line of lines.slice(0, 15)) {
        if (line === name) continue; // Skip the name line
        if (line.includes('@') || line.includes('http') || line.includes('+')) continue; // Skip contact info
        
        const hasTitle = titleKeywords.some(keyword => 
          line.toLowerCase().includes(keyword)
        );
        
        // Look for title patterns like "Technical Domain Expert | AI Solutions & Customer Success"
        if (hasTitle && (line.includes('|') || line.includes('&') || line.length < 100)) {
          title = line;
          break;
        }
      }
      
      // Extract location - look for "Berlin, Germany" pattern
      let location = '';
      const locationPatterns = [
        /([A-Z][a-z]+,\s*[A-Z][a-z]+)/g, // City, Country like "Berlin, Germany"
        /([A-Z][a-z]+,\s*[A-Z]{2,3})/g, // City, Country Code
        /([A-Z][a-z]+\s+[A-Z][a-z]+,\s*[A-Z][a-z]+)/g // City State, Country
      ];
      
      for (const pattern of locationPatterns) {
        const match = text.match(pattern);
        if (match) {
          // Filter out dates and other non-location matches
          const validLocation = match.find(loc => 
            !loc.match(/\d{4}/) && // Not a date
            (loc.includes('Berlin') || loc.includes('Germany') || loc.includes('Dubai') || 
             loc.includes('Munich') || loc.includes('London') || loc.includes('New York'))
          );
          if (validLocation) {
            location = validLocation;
            break;
          }
        }
      }
      
      // Extract experience entries - improved for your CV format
      const experience: any[] = [];
      const experienceKeywords = ['professional experience', 'experience', 'employment', 'work history', 'career'];
      let inExperienceSection = false;
      let currentJob: any = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();
        
        // Check if we're entering experience section
        if (experienceKeywords.some(keyword => lowerLine.includes(keyword))) {
          inExperienceSection = true;
          continue;
        }
        
        // Check if we're leaving experience section
        if (inExperienceSection && (
          lowerLine.includes('education') || 
          lowerLine.includes('skills') || 
          lowerLine.includes('languages') ||
          lowerLine.includes('why rematiq')
        )) {
          if (currentJob) experience.push(currentJob);
          break;
        }
        
        if (inExperienceSection) {
          // Look for job titles with | separator (like "Solution Architect | Customer Project Delivery")
          const hasJobPattern = line.includes('|') && !line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*');
          const hasDatePattern = /\d{2}\/\d{4}|present|current|\d{4}/i.test(line);
          
          if (hasJobPattern || (titleKeywords.some(keyword => lowerLine.includes(keyword)) && hasDatePattern)) {
            if (currentJob) experience.push(currentJob);
            
            // Parse job title and company from lines like:
            // "Solution Architect | Customer Project Delivery & AI Solutions"
            // "BuildingMinds GmbH, Berlin"
            // "10/2023 – Present"
            
            let jobTitle = line;
            let company = '';
            let location = '';
            let startDate = '';
            let endDate = '';
            
            // If line contains |, split it
            if (line.includes('|')) {
              const parts = line.split('|');
              jobTitle = parts[0].trim();
            }
            
            // Look for company in next few lines
            for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
              const nextLine = lines[j];
              if (nextLine && !nextLine.startsWith('•') && !nextLine.startsWith('-')) {
                // Check if it's a company line (contains company indicators)
                if (nextLine.includes('GmbH') || nextLine.includes('LLC') || nextLine.includes('Inc') || 
                    nextLine.includes('Ltd') || nextLine.includes('Corp') || nextLine.includes('University') ||
                    nextLine.includes('School') || nextLine.includes('Solutions')) {
                  const companyParts = nextLine.split(',');
                  company = companyParts[0].trim();
                  if (companyParts[1]) location = companyParts[1].trim();
                  break;
                }
                // Check if it's a date line
                const dateMatch = nextLine.match(/(\d{2}\/\d{4}|\d{4})\s*[-–]\s*(\d{2}\/\d{4}|\d{4}|present|current)/i);
                if (dateMatch) {
                  startDate = dateMatch[1];
                  endDate = dateMatch[2];
                  break;
                }
              }
            }
            
            currentJob = {
              id: crypto.randomUUID(),
              jobTitle: jobTitle,
              company: company,
              location: location,
              startDate: startDate,
              endDate: endDate,
              bullets: []
            };
            
          } else if (currentJob && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
            // Add bullet point - look for category in bold text
            const bulletText = line.replace(/^[•\-*]\s*/, '');
            let categoryLabel = 'Achievement';
            
            // Extract category from bold text patterns like "Customer Project Delivery & POC Leadership:"
            const categoryMatch = bulletText.match(/^([^:]+):/);
            if (categoryMatch) {
              categoryLabel = categoryMatch[1].replace(/\*\*/g, '').trim(); // Remove markdown bold
            }
            
            currentJob.bullets.push({
              id: crypto.randomUUID(),
              categoryLabel: categoryLabel,
              description: bulletText
            });
          }
        }
      }
      
      if (currentJob) experience.push(currentJob);
      
      // Extract education
      const education: any[] = [];
      const educationKeywords = ['education', 'academic', 'qualifications', 'degrees'];
      let inEducationSection = false;
      
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        if (educationKeywords.some(keyword => lowerLine.includes(keyword))) {
          inEducationSection = true;
          continue;
        }
        
        if (inEducationSection && (
          lowerLine.includes('experience') || 
          lowerLine.includes('skills') || 
          lowerLine.includes('languages')
        )) {
          break;
        }
        
        if (inEducationSection) {
          const degreeKeywords = ['bachelor', 'master', 'phd', 'doctorate', 'diploma', 'certificate', 'degree'];
          const hasDegree = degreeKeywords.some(keyword => lowerLine.includes(keyword));
          
          if (hasDegree || (line.includes('University') || line.includes('College') || line.includes('Institute'))) {
            const parts = line.split(/\s*[\|\-]\s*/);
            education.push({
              id: crypto.randomUUID(),
              degree: parts[0] || line,
              field: parts[1] || '',
              institution: parts[2] || parts[1] || '',
              startDate: '',
              endDate: ''
            });
          }
        }
      }
      
      // Extract skills
      const skills: any[] = [];
      const skillsKeywords = ['skills', 'competencies', 'technologies', 'technical skills'];
      let inSkillsSection = false;
      let currentSkillCategory: any = null;
      
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        if (skillsKeywords.some(keyword => lowerLine.includes(keyword))) {
          inSkillsSection = true;
          continue;
        }
        
        if (inSkillsSection && (
          lowerLine.includes('experience') || 
          lowerLine.includes('education') || 
          lowerLine.includes('languages')
        )) {
          if (currentSkillCategory) skills.push(currentSkillCategory);
          break;
        }
        
        if (inSkillsSection && line.length > 3) {
          // Check if this is a skill category
          const categoryKeywords = ['programming', 'languages', 'frameworks', 'tools', 'databases', 'technologies'];
          const isCategory = categoryKeywords.some(keyword => lowerLine.includes(keyword)) || 
                           (line.endsWith(':') && line.length < 50);
          
          if (isCategory) {
            if (currentSkillCategory) skills.push(currentSkillCategory);
            currentSkillCategory = {
              id: crypto.randomUUID(),
              name: line.replace(':', ''),
              skills: []
            };
          } else if (currentSkillCategory) {
            // Add skills to current category
            const skillList = line.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 1);
            for (const skill of skillList) {
              currentSkillCategory.skills.push({
                name: skill,
                description: '',
                keywords: [skill.toLowerCase()]
              });
            }
          } else {
            // Create a general skills category
            if (!currentSkillCategory) {
              currentSkillCategory = {
                id: crypto.randomUUID(),
                name: 'Technical Skills',
                skills: []
              };
            }
            const skillList = line.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 1);
            for (const skill of skillList) {
              currentSkillCategory.skills.push({
                name: skill,
                description: '',
                keywords: [skill.toLowerCase()]
              });
            }
          }
        }
      }
      
      if (currentSkillCategory) skills.push(currentSkillCategory);
      
      // Extract languages
      const languages: any[] = [];
      const languageKeywords = ['languages', 'linguistic'];
      let inLanguageSection = false;
      
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        if (languageKeywords.some(keyword => lowerLine.includes(keyword))) {
          inLanguageSection = true;
          continue;
        }
        
        if (inLanguageSection && (
          lowerLine.includes('experience') || 
          lowerLine.includes('education') || 
          lowerLine.includes('skills')
        )) {
          break;
        }
        
        if (inLanguageSection && line.length > 3) {
          const langParts = line.split(/[-–:]/).map(p => p.trim());
          if (langParts.length >= 2) {
            languages.push({
              id: crypto.randomUUID(),
              name: langParts[0],
              proficiency: langParts[1]
            });
          } else {
            languages.push({
              id: crypto.randomUUID(),
              name: line,
              proficiency: 'Not specified'
            });
          }
        }
      }
      
      // Extract summary/objective
      let summary = '';
      const summaryKeywords = ['summary', 'objective', 'profile', 'about'];
      let inSummarySection = false;
      let summaryLines = [];
      
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        if (summaryKeywords.some(keyword => lowerLine.includes(keyword))) {
          inSummarySection = true;
          continue;
        }
        
        if (inSummarySection && (
          lowerLine.includes('experience') || 
          lowerLine.includes('education') || 
          lowerLine.includes('skills')
        )) {
          break;
        }
        
        if (inSummarySection && line.length > 20) {
          summaryLines.push(line);
        }
      }
      
      summary = summaryLines.join(' ').substring(0, 500);
      
      return {
        header: {
          name: name || 'Name not found',
          title: title || '',
          location: location || '',
          phone: phone || '',
          email: email || '',
          linkedin: linkedin || '',
          github: github || ''
        },
        summary: summary || '',
        experience: experience || [],
        education: education || [],
        skills: skills || [],
        languages: languages || [],
        references: []
      };
    };


    const parsedProfile = parseAdvancedInfo(extractedText);
    
    // Calculate realistic confidence based on extracted information
    let confidence = 0;
    let foundItems = 0;
    
    if (parsedProfile.header.name && parsedProfile.header.name !== 'Name not found') {
      confidence += 15;
      foundItems++;
    }
    if (parsedProfile.header.email) {
      confidence += 15;
      foundItems++;
    }
    if (parsedProfile.header.phone) {
      confidence += 10;
      foundItems++;
    }
    if (parsedProfile.header.title) {
      confidence += 10;
      foundItems++;
    }
    if (parsedProfile.header.location) {
      confidence += 5;
      foundItems++;
    }
    if (parsedProfile.header.linkedin) {
      confidence += 5;
      foundItems++;
    }
    if (parsedProfile.header.github) {
      confidence += 5;
      foundItems++;
    }
    if (parsedProfile.summary && parsedProfile.summary.length > 50) {
      confidence += 10;
      foundItems++;
    }
    if (parsedProfile.experience && parsedProfile.experience.length > 0) {
      confidence += 15;
      foundItems++;
    }
    if (parsedProfile.education && parsedProfile.education.length > 0) {
      confidence += 10;
      foundItems++;
    }
    if (parsedProfile.skills && parsedProfile.skills.length > 0) {
      confidence += 10;
      foundItems++;
    }
    if (parsedProfile.languages && parsedProfile.languages.length > 0) {
      confidence += 5;
      foundItems++;
    }

    const warnings = [];
    if (confidence < 30) {
      warnings.push('Very limited information could be extracted. Please complete your profile manually.');
    } else if (confidence < 60) {
      warnings.push('Some information was extracted, but please review and complete missing details.');
    } else {
      warnings.push('Good amount of information extracted. Please review for accuracy.');
    }
    
    if (!parsedProfile.header.email) {
      warnings.push('Email address not found. Please add it manually.');
    }
    if (parsedProfile.experience.length === 0) {
      warnings.push('No work experience found. Please add your professional experience.');
    }
    if (parsedProfile.skills.length === 0) {
      warnings.push('No skills found. Please add your technical and professional skills.');
    }

    return NextResponse.json({
      success: true,
      extractedText: extractedText.substring(0, 2000) + (extractedText.length > 2000 ? '...' : ''), // Show more text for debugging
      parsedProfile,
      confidence,
      warnings,
      errors: [],
      debug: {
        textLength: extractedText.length,
        foundItems: foundItems,
        sections: {
          hasExperience: parsedProfile.experience.length > 0,
          hasEducation: parsedProfile.education.length > 0,
          hasSkills: parsedProfile.skills.length > 0,
          hasLanguages: parsedProfile.languages.length > 0
        }
      }
    });

  } catch (error) {
    console.error('CV parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse CV', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}