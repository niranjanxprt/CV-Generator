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
  
  // Step 1: Smart bullet reduction - 3-4 bullets per experience
  const bulletDistribution = [4, 3, 3, 2]; // bullets per experience
  
  modifiedProfile.experience = modifiedProfile.experience.map((exp, index) => {
    const allowedBullets = bulletDistribution[index] || 2;
    const actualBullets = Math.min(allowedBullets, exp.bullets.length);
    
    // Take only the highest scoring bullets
    const sortedBullets = exp.bullets
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, actualBullets);
    
    return {
      ...exp,
      bullets: sortedBullets
    };
  });
  
  warnings.push(`Smart bullet distribution: ${bulletDistribution.slice(0, modifiedProfile.experience.length).join(', ')} bullets per experience`);
  
  // Step 2: Keep only 4 most recent experiences
  const maxExperiences = 4;
  if (modifiedProfile.experience.length > maxExperiences) {
    const removedCount = modifiedProfile.experience.length - maxExperiences;
    modifiedProfile.experience = modifiedProfile.experience.slice(0, maxExperiences);
    warnings.push(`Kept ${maxExperiences} most recent experiences (removed ${removedCount})`);
  }
  
  // Step 3: Reasonable summary length - 300 characters
  const summaryLimit = 300;
  if (modifiedContent.summary.length > summaryLimit) {
    const originalLength = modifiedContent.summary.length;
    // Smart truncation - try to end at a sentence
    let truncated = modifiedContent.summary.substring(0, summaryLimit);
    const lastSentence = truncated.lastIndexOf('. ');
    if (lastSentence > summaryLimit * 0.7) {
      truncated = truncated.substring(0, lastSentence + 1);
    } else {
      truncated += '...';
    }
    modifiedContent.summary = truncated;
    warnings.push(`Compact summary: ${originalLength} → ${truncated.length} chars`);
  }
  
  // Step 4: Keep only 3 most relevant skill categories
  const maxSkillCategories = 3;
  if (modifiedContent.reorderedSkills.length > maxSkillCategories) {
    const removedCount = modifiedContent.reorderedSkills.length - maxSkillCategories;
    modifiedContent.reorderedSkills = modifiedContent.reorderedSkills.slice(0, maxSkillCategories);
    warnings.push(`Kept ${maxSkillCategories} skill categories (removed ${removedCount})`);
  }
  
  // Step 5: Limit skills per category to 4
  modifiedContent.reorderedSkills = modifiedContent.reorderedSkills.map(category => ({
    ...category,
    skills: category.skills.slice(0, 4) // Max 4 skills per category
  }));
  
  // Step 6: Keep both education entries but make them ultra-compact
  const maxEducation = 2;
  if (modifiedProfile.education.length > maxEducation) {
    modifiedProfile.education = modifiedProfile.education.slice(0, maxEducation);
    warnings.push(`Kept ${maxEducation} education entries`);
  }
  
  // Step 7: Keep both languages
  const maxLanguages = 2;
  if (modifiedProfile.languages.length > maxLanguages) {
    modifiedProfile.languages = modifiedProfile.languages.slice(0, maxLanguages);
    warnings.push(`Kept ${maxLanguages} languages`);
  }
  
  // Step 8: Keep only 1 reference for ultra-compact layout
  const maxReferences = 1;
  if (modifiedProfile.references.length > maxReferences) {
    modifiedProfile.references = modifiedProfile.references.slice(0, maxReferences);
    warnings.push(`Kept ${maxReferences} reference`);
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