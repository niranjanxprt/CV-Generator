/**
 * Download API Route for Dual Format Support (PDF and DOCX)
 * 
 * This API endpoint provides download functionality for both PDF and DOCX formats,
 * ensuring ATS compatibility across different document types.
 * 
 * Requirements: 18.2, 18.3 - Dual format download support with proper error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { DocxGenerator } from '@/export/docxGenerator';
import { EnglishCVPDF } from '@/components/pdf/EnglishCVPDF';
import { GermanCVPDF } from '@/components/pdf/GermanCVPDF';
import { UserProfile, TailoredContent } from '@/types';
import { atsAnalytics } from '@/lib/ats-analytics';
import { ATSValidator } from '@/validation/atsValidator';

export interface DownloadRequest {
  profile: UserProfile;
  tailoredContent: TailoredContent;
  format: 'pdf' | 'docx';
  language?: 'en' | 'de';
  filename?: string;
}

export interface DownloadResponse {
  success: boolean;
  message?: string;
  error?: string;
  metadata?: {
    format: string;
    filename: string;
    size: number;
    generatedAt: string;
  };
}

/**
 * POST /api/download
 * Generate and download resume in specified format
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let success = false;
  let buffer: Buffer | null = null;
  let atsScore: any = null;
  
  try {
    // Parse request body
    const body: DownloadRequest = await request.json();
    
    // Validate request
    const validation = validateDownloadRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid request: ${validation.errors.join(', ')}` 
        } as DownloadResponse,
        { status: 400 }
      );
    }

    const { profile, tailoredContent, format, language = 'en', filename } = body;

    // Generate document based on format
    let contentType: string;
    let defaultFilename: string;

    if (format === 'pdf') {
      // Generate PDF using React PDF
      const PDFComponent = language === 'de' ? GermanCVPDF : EnglishCVPDF;
      
      buffer = await renderToBuffer(
        PDFComponent({ profile, tailoredContent })
      );
      
      contentType = 'application/pdf';
      defaultFilename = `${sanitizeFilename(profile.header.name)}_CV_${language.toUpperCase()}.pdf`;
      
    } else if (format === 'docx') {
      // Generate DOCX using DocxGenerator
      buffer = await DocxGenerator.generateResume(profile, tailoredContent, {
        fontSize: 11,
        fontFamily: 'Calibri' // ATS-compatible font for DOCX
      });
      
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      defaultFilename = `${sanitizeFilename(profile.header.name)}_CV_${language.toUpperCase()}.docx`;
      
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unsupported format. Use "pdf" or "docx".' 
        } as DownloadResponse,
        { status: 400 }
      );
    }

    const finalFilename = filename || defaultFilename;
    const generationTime = Date.now() - startTime;
    success = true;

    // Perform ATS validation and scoring
    try {
      const validator = new ATSValidator();
      atsScore = await validator.validateDocument(buffer, format, profile, tailoredContent);
    } catch (validationError) {
      console.warn('ATS validation failed:', validationError);
      // Continue with download even if validation fails
    }

    // Track analytics
    try {
      await atsAnalytics.trackGeneration(
        format,
        language,
        generationTime,
        buffer.length,
        success,
        atsScore,
        {
          experienceCount: profile.experience.length,
          skillCategoryCount: tailoredContent.reorderedSkills.length,
          educationCount: profile.education.length,
          languageCount: profile.languages.length,
          summaryWordCount: tailoredContent.summary.split(' ').length,
          totalBulletPoints: profile.experience.reduce((sum, exp) => sum + exp.bullets.length, 0)
        },
        {
          matchScore: tailoredContent.matchScore,
          mustHaveKeywordsFound: tailoredContent.mustHaveKeywords?.length || 0,
          preferredKeywordsFound: tailoredContent.preferredKeywords?.length || 0,
          niceToHaveKeywordsFound: tailoredContent.niceToHaveKeywords?.length || 0,
          totalKeywords: (tailoredContent.mustHaveKeywords?.length || 0) + 
                       (tailoredContent.preferredKeywords?.length || 0) + 
                       (tailoredContent.niceToHaveKeywords?.length || 0)
        }
      );
    } catch (analyticsError) {
      console.warn('Analytics tracking failed:', analyticsError);
      // Continue with download even if analytics fails
    }

    // Create response with file download
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${finalFilename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    // Add metadata headers for client-side processing
    const metadata = {
      format,
      filename: finalFilename,
      size: buffer.length,
      generatedAt: new Date().toISOString(),
      generationTime,
      atsScore: atsScore?.overall || null
    };
    
    response.headers.set('X-Download-Metadata', JSON.stringify(metadata));

    return response;

  } catch (error) {
    console.error('Download generation error:', error);
    
    // Track failed generation
    try {
      const generationTime = Date.now() - startTime;
      await atsAnalytics.trackGeneration(
        'pdf', // Default format for error tracking
        'en',  // Default language for error tracking
        generationTime,
        0,     // No file size for failed generation
        false, // Success = false
        null,  // No ATS score for failed generation
        { experienceCount: 0, skillCategoryCount: 0, educationCount: 0, languageCount: 0, summaryWordCount: 0, totalBulletPoints: 0 },
        { matchScore: 0, mustHaveKeywordsFound: 0, preferredKeywordsFound: 0, niceToHaveKeywordsFound: 0, totalKeywords: 0 },
        error instanceof Error ? error.message : 'Unknown error'
      );
    } catch (analyticsError) {
      console.warn('Failed to track error analytics:', analyticsError);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Document generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      } as DownloadResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/download/formats
 * Get available download formats and their capabilities
 */
export async function GET() {
  try {
    const formats = {
      pdf: {
        name: 'PDF',
        description: 'Portable Document Format - Universal compatibility',
        contentType: 'application/pdf',
        extension: '.pdf',
        atsCompatibility: 'Excellent',
        features: [
          'Universal compatibility',
          'Preserves exact formatting',
          'Standard PDF fonts (Helvetica)',
          'Optimized for ATS parsing'
        ]
      },
      docx: {
        name: 'DOCX',
        description: 'Microsoft Word Document - Editable format',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: '.docx',
        atsCompatibility: 'Excellent',
        features: [
          'Editable by recruiters',
          'Native ATS format',
          'Standard fonts (Calibri)',
          'Structured document format'
        ]
      }
    };

    return NextResponse.json({
      success: true,
      formats,
      supportedLanguages: ['en', 'de'],
      recommendations: {
        ats: 'Both PDF and DOCX formats are ATS-optimized with standard fonts',
        editing: 'Use DOCX if recruiters need to edit the document',
        compatibility: 'Use PDF for maximum universal compatibility'
      }
    });

  } catch (error) {
    console.error('Format info error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve format information' 
      },
      { status: 500 }
    );
  }
}

/**
 * Validate download request parameters
 */
function validateDownloadRequest(body: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!body.profile) {
    errors.push('Profile data is required');
  } else {
    if (!body.profile.header?.name) {
      errors.push('Profile name is required');
    }
    if (!body.profile.header?.email) {
      errors.push('Profile email is required');
    }
  }

  if (!body.tailoredContent) {
    errors.push('Tailored content is required');
  } else {
    if (!body.tailoredContent.summary) {
      errors.push('Professional summary is required');
    }
  }

  if (!body.format) {
    errors.push('Format parameter is required');
  } else if (!['pdf', 'docx'].includes(body.format)) {
    errors.push('Format must be either "pdf" or "docx"');
  }

  // Validate language if provided
  if (body.language && !['en', 'de'].includes(body.language)) {
    errors.push('Language must be either "en" or "de"');
  }

  // Validate filename if provided
  if (body.filename && typeof body.filename !== 'string') {
    errors.push('Filename must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize filename for safe file system usage
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50) // Limit length
    .trim();
}

/**
 * Generate download metadata for tracking and analytics
 */
export function generateDownloadMetadata(
  profile: UserProfile, 
  tailoredContent: TailoredContent, 
  format: 'pdf' | 'docx'
) {
  return {
    profileName: profile.header.name,
    format,
    language: 'en', // Default, could be parameterized
    experienceCount: profile.experience.length,
    skillCategoryCount: tailoredContent.reorderedSkills.length,
    matchScore: tailoredContent.matchScore,
    generatedAt: new Date().toISOString(),
    fileSize: 0, // Will be set after generation
    atsOptimized: true
  };
}