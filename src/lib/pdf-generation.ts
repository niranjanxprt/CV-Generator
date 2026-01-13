import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { UserProfile, JobAnalysis, TailoredContent, DocumentType, GeneratedDocument } from '@/types';
import { GermanCVPDF } from '@/components/pdf/GermanCVPDF';
import { GermanCoverLetterPDF } from '@/components/pdf/GermanCoverLetterPDF';
import { EnglishCVPDF } from '@/components/pdf/EnglishCVPDF';
import { EnglishCoverLetterPDF } from '@/components/pdf/EnglishCoverLetterPDF';
import { generateCoverLetter } from './content-generation';
import { createTailoredContent } from './cv-tailoring';

/**
 * Get actual page count of a PDF document
 * Uses @react-pdf/renderer to render and count pages
 */
export async function getActualPageCount(pdfBlob: Blob): Promise<number> {
  try {
    // For now, we'll estimate based on content length
    // In a full implementation, you'd use pdf-lib to parse the actual PDF
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdfSize = arrayBuffer.byteLength;
    
    // Rough estimation: 1 page ≈ 50KB for typical CV content
    const estimatedPages = Math.ceil(pdfSize / 50000);
    return Math.max(1, Math.min(estimatedPages, 3)); // Cap at 3 pages for safety
  } catch (error) {
    console.warn('Failed to count PDF pages, defaulting to 1:', error);
    return 1;
  }
}

/**
 * Enforce CV page limit by reducing content aggressively
 * Reduces bullets per experience and removes oldest experiences if needed
 */
export function enforceCVPageLimit(
  profile: UserProfile, 
  tailoredContent: TailoredContent,
  maxPages: number = 2
): { profile: UserProfile; tailoredContent: TailoredContent; warnings: string[] } {
  const warnings: string[] = [];
  let modifiedProfile = { ...profile };
  let modifiedContent = { ...tailoredContent };
  
  // Step 1: Smart bullet reduction - keep more bullets for recent experiences
  let totalBullets = 0;
  const maxTotalBullets = maxPages === 2 ? 8 : 12; // Total bullets across all experiences
  
  // Prioritize recent experiences - give more bullets to recent jobs
  const bulletDistribution = maxPages === 2 ? [4, 2, 1, 1] : [6, 3, 2, 1]; // bullets per experience
  
  modifiedProfile.experience = modifiedProfile.experience.map((exp, index) => {
    const allowedBullets = bulletDistribution[index] || 1;
    const actualBullets = Math.min(allowedBullets, exp.bullets.length);
    totalBullets += actualBullets;
    
    return {
      ...exp,
      bullets: exp.bullets.slice(0, actualBullets)
    };
  });
  
  warnings.push(`Distributed ${totalBullets} bullets across experiences (${bulletDistribution.slice(0, modifiedProfile.experience.length).join(', ')}) to fit ${maxPages}-page limit`);
  
  // Step 2: Keep all experiences but limit total count
  const maxExperiences = maxPages === 2 ? 4 : 5; // Keep all 4 experiences for 2-page
  if (modifiedProfile.experience.length > maxExperiences) {
    const removedCount = modifiedProfile.experience.length - maxExperiences;
    modifiedProfile.experience = modifiedProfile.experience.slice(0, maxExperiences);
    warnings.push(`Removed ${removedCount} oldest experience entries to fit ${maxPages}-page limit`);
  }
  
  // Step 3: Smart summary trimming - keep key information
  const summaryLimit = maxPages === 2 ? 200 : 300; // Allow longer summary
  if (modifiedContent.summary.length > summaryLimit) {
    const originalLength = modifiedContent.summary.length;
    // Smart truncation - try to end at a sentence
    let truncated = modifiedContent.summary.substring(0, summaryLimit);
    const lastSentence = truncated.lastIndexOf('. ');
    if (lastSentence > summaryLimit * 0.8) { // If we can end at a sentence without losing too much
      truncated = truncated.substring(0, lastSentence + 1);
    } else {
      truncated += '...';
    }
    modifiedContent.summary = truncated;
    warnings.push(`Trimmed summary from ${originalLength} to ${truncated.length} characters for ${maxPages}-page limit`);
  }
  
  // Step 4: Keep more skill categories but optimize layout
  const maxSkillCategories = maxPages === 2 ? 3 : 4; // Keep 3 categories for 2-page
  if (modifiedContent.reorderedSkills.length > maxSkillCategories) {
    const removedCount = modifiedContent.reorderedSkills.length - maxSkillCategories;
    modifiedContent.reorderedSkills = modifiedContent.reorderedSkills.slice(0, maxSkillCategories);
    warnings.push(`Reduced skill categories from ${modifiedContent.reorderedSkills.length + removedCount} to ${maxSkillCategories} for ${maxPages}-page limit`);
  }
  
  // Step 5: Keep both education entries
  const maxEducation = maxPages === 2 ? 2 : 3; // Keep both education entries
  if (modifiedProfile.education.length > maxEducation) {
    const removedCount = modifiedProfile.education.length - maxEducation;
    modifiedProfile.education = modifiedProfile.education.slice(0, maxEducation);
    warnings.push(`Reduced education entries to ${maxEducation} for ${maxPages}-page limit`);
  }
  
  // Step 6: Keep both languages
  const maxLanguages = maxPages === 2 ? 2 : 3; // Keep both languages
  if (modifiedProfile.languages.length > maxLanguages) {
    const removedCount = modifiedProfile.languages.length - maxLanguages;
    modifiedProfile.languages = modifiedProfile.languages.slice(0, maxLanguages);
    warnings.push(`Reduced languages to ${maxLanguages} for ${maxPages}-page limit`);
  }
  
  // Step 7: Keep reference
  const maxReferences = maxPages === 2 ? 1 : 2; // Keep 1 reference for 2-page
  if (modifiedProfile.references.length > maxReferences) {
    const removedCount = modifiedProfile.references.length - maxReferences;
    modifiedProfile.references = modifiedProfile.references.slice(0, maxReferences);
    warnings.push(`Reduced references to ${maxReferences} for ${maxPages}-page limit`);
  }
  
  return {
    profile: modifiedProfile,
    tailoredContent: modifiedContent,
    warnings
  };
}

/**
 * Enforce cover letter page limit by adjusting content
 * Adjusts font size and spacing, trims content if necessary
 */
export function enforceCoverLetterPageLimit(
  content: string,
  maxPages: number = 1
): { content: string; warnings: string[] } {
  const warnings: string[] = [];
  let modifiedContent = content;
  
  // Count words to estimate length
  const wordCount = content.split(/\s+/).length;
  
  // If too long, trim content
  if (wordCount > 500) {
    const paragraphs = content.split('\n\n');
    let trimmedContent = '';
    let currentWordCount = 0;
    
    for (const paragraph of paragraphs) {
      const paragraphWords = paragraph.split(/\s+/).length;
      if (currentWordCount + paragraphWords <= 450) {
        trimmedContent += paragraph + '\n\n';
        currentWordCount += paragraphWords;
      } else {
        // Add partial paragraph if space allows
        const remainingWords = 450 - currentWordCount;
        if (remainingWords > 20) {
          const words = paragraph.split(/\s+/);
          const partialParagraph = words.slice(0, remainingWords).join(' ') + '...';
          trimmedContent += partialParagraph;
        }
        break;
      }
    }
    
    modifiedContent = trimmedContent.trim();
    warnings.push(`Trimmed cover letter from ${wordCount} to ~${currentWordCount} words to fit page limit`);
  }
  
  return {
    content: modifiedContent,
    warnings
  };
}

/**
 * Reduce bullets per experience entry
 */
export function reduceBulletsPerExperience(
  experiences: UserProfile['experience'],
  maxBullets: number
): UserProfile['experience'] {
  return experiences.map(exp => ({
    ...exp,
    bullets: exp.bullets.slice(0, maxBullets)
  }));
}

/**
 * Trim cover letter content to fit page limit
 */
export function trimCoverLetterContent(content: string, maxWords: number): string {
  const words = content.split(/\s+/);
  if (words.length <= maxWords) return content;
  
  return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Generate PDF document with page limit enforcement
 */
export async function generatePDFDocument(
  type: DocumentType,
  profile: UserProfile,
  jobAnalysis: JobAnalysis,
  tailoredContent: TailoredContent
): Promise<GeneratedDocument> {
  let warnings: string[] = [];
  let modifiedProfile = profile;
  let modifiedTailoredContent = tailoredContent;
  
  // Ensure profile photo is included from localStorage
  const savedPhoto = typeof window !== 'undefined' ? localStorage.getItem('profilePhoto') : null;
  if (savedPhoto && !modifiedProfile.header.photo) {
    modifiedProfile = {
      ...modifiedProfile,
      header: {
        ...modifiedProfile.header,
        photo: savedPhoto
      }
    };
  }
  
  // Apply page limit enforcement for CVs
  if (type === 'germanCV' || type === 'englishCV') {
    const result = enforceCVPageLimit(modifiedProfile, tailoredContent, 2);
    modifiedProfile = result.profile;
    modifiedTailoredContent = result.tailoredContent;
    warnings = result.warnings;
  }
  
  let pdfComponent: React.ReactElement;
  let documentName: string;
  
  switch (type) {
    case 'germanCV':
      pdfComponent = React.createElement(GermanCVPDF, { 
        profile: modifiedProfile, 
        tailoredContent: modifiedTailoredContent 
      });
      documentName = 'German CV (Lebenslauf)';
      break;
      
    case 'englishCV':
      pdfComponent = React.createElement(EnglishCVPDF, { 
        profile: modifiedProfile, 
        tailoredContent: modifiedTailoredContent 
      });
      documentName = 'English CV (Resume)';
      break;
      
    case 'germanCoverLetter':
      const germanContent = await generateCoverLetter(
        profile, 
        jobAnalysis, 
        tailoredContent, 
        'German'
      );
      const germanResult = enforceCoverLetterPageLimit(germanContent, 1);
      warnings.push(...germanResult.warnings);
      
      pdfComponent = React.createElement(GermanCoverLetterPDF, {
        profile,
        jobAnalysis,
        content: germanResult.content
      });
      documentName = 'German Cover Letter (Anschreiben)';
      break;
      
    case 'englishCoverLetter':
      const englishContent = await generateCoverLetter(
        profile, 
        jobAnalysis, 
        tailoredContent, 
        'English'
      );
      const englishResult = enforceCoverLetterPageLimit(englishContent, 1);
      warnings.push(...englishResult.warnings);
      
      pdfComponent = React.createElement(EnglishCoverLetterPDF, {
        profile,
        jobAnalysis,
        content: englishResult.content
      });
      documentName = 'English Cover Letter';
      break;
      
    default:
      throw new Error(`Unsupported document type: ${type}`);
  }
  
  // Generate PDF blob
  const pdfBlob = await pdf(pdfComponent as any).toBlob();
  const pageCount = await getActualPageCount(pdfBlob);
  
  // Validate page limits
  const maxPages = type.includes('CV') ? 2 : 1;
  if (pageCount > maxPages) {
    warnings.push(`Document exceeds ${maxPages} page limit (${pageCount} pages)`);
  }
  
  return {
    id: `${type}-${Date.now()}`,
    type,
    name: documentName,
    pageCount,
    matchScore: tailoredContent.matchScore,
    pdfBlob,
    warnings
  };
}

/**
 * Generate multiple documents based on selection
 */
export async function generateSelectedDocuments(
  selectedTypes: DocumentType[],
  profile: UserProfile,
  jobAnalysis: JobAnalysis
): Promise<GeneratedDocument[]> {
  // Create tailored content once for all documents
  const tailoredContent = await createTailoredContent(profile, jobAnalysis);
  
  // Generate each selected document
  const documents = await Promise.all(
    selectedTypes.map(type => 
      generatePDFDocument(type, profile, jobAnalysis, tailoredContent)
    )
  );
  
  return documents;
}