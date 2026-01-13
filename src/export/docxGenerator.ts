/**
 * DOCX Generator for ATS-Compatible Resume Generation
 * 
 * This module provides DOCX generation capability to complement PDF generation,
 * ensuring dual format support for maximum ATS compatibility.
 * 
 * Requirements: 1.1, 18.1, 18.2, 18.3, 18.4
 */

import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType,
  BorderStyle,
  ShadingType,
  WidthType,
  Table,
  TableRow,
  TableCell,
  VerticalAlign
} from 'docx';
import { UserProfile, TailoredContent } from '@/types';

export interface DocxGenerationOptions {
  includePhoto?: boolean;
  fontSize?: number;
  fontFamily?: string;
  pageMargins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * DOCX Generator class for creating ATS-compatible resume documents
 */
export class DocxGenerator {
  private static readonly DEFAULT_OPTIONS: Required<DocxGenerationOptions> = {
    includePhoto: false, // Photos can cause ATS issues in DOCX
    fontSize: 11, // 11pt for optimal ATS readability
    fontFamily: 'Calibri', // Standard DOCX font, ATS-compatible
    pageMargins: {
      top: 720, // 0.5 inch in twips (1440 twips = 1 inch)
      right: 720,
      bottom: 720,
      left: 720
    }
  };

  /**
   * Generate a complete resume DOCX document
   * @param profile - User profile data
   * @param tailoredContent - Tailored content for the specific job
   * @param options - Generation options
   * @returns Promise<Buffer> - DOCX file as buffer
   */
  static async generateResume(
    profile: UserProfile,
    tailoredContent: TailoredContent,
    options: DocxGenerationOptions = {}
  ): Promise<Buffer> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      // Create document sections
      const sections = [
        ...this.createHeader(profile, opts),
        ...this.createSummary(tailoredContent.summary, opts),
        ...this.createExperience(profile.experience, opts),
        ...this.createEducation(profile.education, opts),
        ...this.createSkills(tailoredContent.reorderedSkills, opts),
        ...this.createLanguages(profile.languages, opts),
        ...this.createReferences(profile.references, opts)
      ];

      // Create DOCX document
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: opts.pageMargins
            }
          },
          children: sections
        }]
      });

      // Generate buffer
      const buffer = await Packer.toBuffer(doc);
      return buffer;
      
    } catch (error) {
      throw new Error(`DOCX generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create header section with contact information
   * @param profile - User profile
   * @param options - Generation options
   * @returns Array of paragraphs for header
   */
  private static createHeader(profile: UserProfile, options: Required<DocxGenerationOptions>): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Name (centered, large font)
    paragraphs.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: profile.header.name,
          bold: true,
          size: Math.round(options.fontSize * 1.5 * 2), // Convert to half-points
          font: options.fontFamily
        })
      ]
    }));

    // Job Title (centered, medium font)
    paragraphs.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 }, // Small space after
      children: [
        new TextRun({
          text: profile.header.title,
          size: Math.round(options.fontSize * 1.2 * 2),
          font: options.fontFamily
        })
      ]
    }));

    // Contact Information (centered, single line)
    const contactInfo = [
      profile.header.location,
      profile.header.phone,
      profile.header.email
    ].filter(Boolean).join(' • ');

    paragraphs.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: contactInfo,
          size: options.fontSize * 2,
          font: options.fontFamily
        })
      ]
    }));

    // Links (centered, single line)
    const links = [
      profile.header.linkedin,
      profile.header.github
    ].filter(Boolean).join(' • ');

    if (links) {
      paragraphs.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 }, // Space before next section
        children: [
          new TextRun({
            text: links,
            size: options.fontSize * 2,
            font: options.fontFamily
          })
        ]
      }));
    }

    return paragraphs;
  }

  /**
   * Create professional summary section
   * @param summary - Tailored summary text
   * @param options - Generation options
   * @returns Array of paragraphs for summary
   */
  private static createSummary(summary: string, options: Required<DocxGenerationOptions>): Paragraph[] {
    return [
      // Section heading
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 120, after: 120 },
        children: [
          new TextRun({
            text: 'PROFESSIONAL SUMMARY',
            bold: true,
            size: Math.round(options.fontSize * 1.1 * 2),
            font: options.fontFamily,
            allCaps: true
          })
        ]
      }),
      
      // Summary content
      new Paragraph({
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: summary,
            size: options.fontSize * 2,
            font: options.fontFamily
          })
        ]
      })
    ];
  }

  /**
   * Create professional experience section
   * @param experiences - Array of work experiences
   * @param options - Generation options
   * @returns Array of paragraphs for experience
   */
  private static createExperience(experiences: UserProfile['experience'], options: Required<DocxGenerationOptions>): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Section heading
    paragraphs.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 120, after: 120 },
      children: [
        new TextRun({
          text: 'PROFESSIONAL EXPERIENCE',
          bold: true,
          size: Math.round(options.fontSize * 1.1 * 2),
          font: options.fontFamily,
          allCaps: true
        })
      ]
    }));

    // Experience entries
    experiences.forEach((exp, index) => {
      // Job title and date range
      paragraphs.push(new Paragraph({
        spacing: { before: index > 0 ? 180 : 0, after: 60 },
        children: [
          new TextRun({
            text: `${exp.jobTitle}${exp.subtitle ? ` | ${exp.subtitle}` : ''}`,
            bold: true,
            size: options.fontSize * 2,
            font: options.fontFamily
          }),
          new TextRun({
            text: `\t${exp.startDate} – ${exp.endDate === 'Heute' ? 'Present' : exp.endDate}`,
            size: options.fontSize * 2,
            font: options.fontFamily,
            italics: true
          })
        ]
      }));

      // Company and location
      paragraphs.push(new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `${exp.company}, ${exp.location}`,
            bold: true,
            size: options.fontSize * 2,
            font: options.fontFamily
          })
        ]
      }));

      // Bullet points
      exp.bullets.forEach(bullet => {
        paragraphs.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 360 }, // Indent bullet points
          children: [
            new TextRun({
              text: `• ${bullet.categoryLabel}: `,
              bold: true,
              size: options.fontSize * 2,
              font: options.fontFamily
            }),
            new TextRun({
              text: bullet.description,
              size: options.fontSize * 2,
              font: options.fontFamily
            })
          ]
        }));
      });
    });

    return paragraphs;
  }

  /**
   * Create education section
   * @param education - Array of education entries
   * @param options - Generation options
   * @returns Array of paragraphs for education
   */
  private static createEducation(education: UserProfile['education'], options: Required<DocxGenerationOptions>): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Section heading
    paragraphs.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: 'EDUCATION',
          bold: true,
          size: Math.round(options.fontSize * 1.1 * 2),
          font: options.fontFamily,
          allCaps: true
        })
      ]
    }));

    // Education entries
    education.forEach((edu, index) => {
      // Degree and date range
      paragraphs.push(new Paragraph({
        spacing: { before: index > 0 ? 120 : 0, after: 60 },
        children: [
          new TextRun({
            text: `${edu.degree} in ${edu.field}`,
            bold: true,
            size: options.fontSize * 2,
            font: options.fontFamily
          }),
          new TextRun({
            text: `\t${edu.startDate} – ${edu.endDate}`,
            size: options.fontSize * 2,
            font: options.fontFamily,
            italics: true
          })
        ]
      }));

      // Institution
      paragraphs.push(new Paragraph({
        spacing: { after: edu.details ? 60 : 120 },
        children: [
          new TextRun({
            text: edu.institution,
            size: options.fontSize * 2,
            font: options.fontFamily
          })
        ]
      }));

      // Details (if any)
      if (edu.details) {
        paragraphs.push(new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: edu.details,
              size: options.fontSize * 2,
              font: options.fontFamily,
              italics: true
            })
          ]
        }));
      }
    });

    return paragraphs;
  }

  /**
   * Create technical skills section
   * @param skillCategories - Array of skill categories
   * @param options - Generation options
   * @returns Array of paragraphs for skills
   */
  private static createSkills(skillCategories: UserProfile['skills'], options: Required<DocxGenerationOptions>): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Section heading
    paragraphs.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: 'TECHNICAL SKILLS & COMPETENCIES',
          bold: true,
          size: Math.round(options.fontSize * 1.1 * 2),
          font: options.fontFamily,
          allCaps: true
        })
      ]
    }));

    // Skill categories
    skillCategories.forEach((category, index) => {
      const skillNames = category.skills.map(skill => skill.name).join(' • ');
      
      paragraphs.push(new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `${category.name}: `,
            bold: true,
            size: options.fontSize * 2,
            font: options.fontFamily
          }),
          new TextRun({
            text: skillNames,
            size: options.fontSize * 2,
            font: options.fontFamily
          })
        ]
      }));
    });

    return paragraphs;
  }

  /**
   * Create languages section
   * @param languages - Array of languages
   * @param options - Generation options
   * @returns Array of paragraphs for languages
   */
  private static createLanguages(languages: UserProfile['languages'], options: Required<DocxGenerationOptions>): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Section heading
    paragraphs.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: 'LANGUAGES',
          bold: true,
          size: Math.round(options.fontSize * 1.1 * 2),
          font: options.fontFamily,
          allCaps: true
        })
      ]
    }));

    // Language entries
    languages.forEach(lang => {
      paragraphs.push(new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: `${lang.name}: `,
            bold: true,
            size: options.fontSize * 2,
            font: options.fontFamily
          }),
          new TextRun({
            text: lang.proficiency,
            size: options.fontSize * 2,
            font: options.fontFamily
          })
        ]
      }));
    });

    return paragraphs;
  }

  /**
   * Create references section
   * @param references - Array of references
   * @param options - Generation options
   * @returns Array of paragraphs for references
   */
  private static createReferences(references: UserProfile['references'], options: Required<DocxGenerationOptions>): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Section heading
    paragraphs.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: 'REFERENCES',
          bold: true,
          size: Math.round(options.fontSize * 1.1 * 2),
          font: options.fontFamily,
          allCaps: true
        })
      ]
    }));

    if (references.length === 0) {
      // Default message when no references provided
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: 'Available upon request',
            size: options.fontSize * 2,
            font: options.fontFamily,
            italics: true
          })
        ]
      }));
    } else {
      // Reference entries
      references.forEach((ref, index) => {
        paragraphs.push(new Paragraph({
          spacing: { before: index > 0 ? 120 : 0, after: 60 },
          children: [
            new TextRun({
              text: ref.name,
              bold: true,
              size: options.fontSize * 2,
              font: options.fontFamily
            })
          ]
        }));

        paragraphs.push(new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: `${ref.title}, ${ref.company}`,
              size: options.fontSize * 2,
              font: options.fontFamily
            })
          ]
        }));

        paragraphs.push(new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: ref.email,
              size: options.fontSize * 2,
              font: options.fontFamily
            })
          ]
        }));
      });
    }

    return paragraphs;
  }

  /**
   * Validate DOCX generation requirements
   * @param profile - User profile to validate
   * @param tailoredContent - Tailored content to validate
   * @returns Validation result
   */
  static validateGenerationRequirements(profile: UserProfile, tailoredContent: TailoredContent): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Validate required profile fields
    if (!profile.header.name || profile.header.name.trim().length === 0) {
      issues.push('Profile name is required');
    }

    if (!profile.header.email || profile.header.email.trim().length === 0) {
      issues.push('Profile email is required');
    }

    if (!tailoredContent.summary || tailoredContent.summary.trim().length === 0) {
      issues.push('Professional summary is required');
    }

    // Validate content length for ATS compatibility
    if (tailoredContent.summary && tailoredContent.summary.length > 1000) {
      issues.push('Professional summary is too long (max 1000 characters for ATS compatibility)');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Get DOCX generation metadata
   * @param profile - User profile
   * @param tailoredContent - Tailored content
   * @returns Generation metadata
   */
  static getGenerationMetadata(profile: UserProfile, tailoredContent: TailoredContent) {
    return {
      profileName: profile.header.name,
      experienceCount: profile.experience.length,
      skillCategoryCount: tailoredContent.reorderedSkills.length,
      educationCount: profile.education.length,
      languageCount: profile.languages.length,
      referenceCount: profile.references.length,
      matchScore: tailoredContent.matchScore,
      summaryLength: tailoredContent.summary.length,
      totalBullets: profile.experience.reduce((sum, exp) => sum + exp.bullets.length, 0),
      generatedAt: new Date().toISOString()
    };
  }
}