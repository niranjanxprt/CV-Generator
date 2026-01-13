import JSZip from 'jszip';
import { DocumentType, GeneratedDocument } from '@/types';

/**
 * Generate proper filename based on document type and user info
 * Uses job title when company name is not available for better naming
 */
export function generateFilename(
  type: DocumentType,
  userName: string,
  companyName: string,
  jobTitle?: string
): string {
  const cleanName = userName.replace(/\s+/g, '_');
  
  // Create a meaningful identifier from company name or job title
  let identifier = '';
  
  if (companyName && 
      companyName.trim() !== '' && 
      companyName !== 'Company' &&
      !companyName.includes('Not_explicitly_mentioned') &&
      !companyName.includes('not mentioned') &&
      !companyName.includes('unknown')) {
    // Use company name if available and valid
    identifier = companyName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .substring(0, 25); // Limit length
  } else if (jobTitle && jobTitle.trim() !== '') {
    // Use job title as fallback, clean it up for filename
    identifier = jobTitle
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .replace(/_+/g, '_') // Remove multiple underscores
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .substring(0, 20); // Limit to 20 characters
      
    // If still empty after cleaning, use fallback
    if (!identifier) {
      identifier = 'Application';
    }
  } else {
    // Final fallback
    identifier = 'Application';
  }
  
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  switch (type) {
    case 'germanCV':
      return `Lebenslauf_${cleanName}_${identifier}_${date}.pdf`;
    case 'germanCoverLetter':
      return `Anschreiben_${cleanName}_${identifier}_${date}.pdf`;
    case 'englishCV':
      return `Resume_${cleanName}_${identifier}_${date}.pdf`;
    case 'englishCoverLetter':
      return `CoverLetter_${cleanName}_${identifier}_${date}.pdf`;
    default:
      return `Document_${cleanName}_${identifier}_${date}.pdf`;
  }
}

/**
 * Download PDF file with proper filename
 * Triggers browser download with correct filename format
 */
export function downloadPDF(pdfBlob: Blob, filename: string): void {
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate ZIP file containing multiple documents
 * Creates properly named ZIP with all selected documents
 */
export async function generateZipFile(
  documents: GeneratedDocument[],
  userName: string,
  companyName: string,
  jobTitle?: string
): Promise<Blob> {
  const zip = new JSZip();
  
  // Add each document to the ZIP
  for (const document of documents) {
    const filename = generateFilename(document.type, userName, companyName, jobTitle);
    zip.file(filename, document.pdfBlob);
  }
  
  // Generate ZIP blob
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}

/**
 * Download confirmation and error handling
 * Provides user feedback for download operations
 */
export function showDownloadConfirmation(filename: string): void {
  // In a real app, you might use a toast notification library
  console.log(`Downloaded: ${filename}`);
  
  // Simple browser notification (optional)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Download Complete', {
      body: `${filename} has been downloaded successfully.`,
      icon: '/favicon.ico'
    });
  }
}

/**
 * Handle download errors gracefully
 * Provides user-friendly error messages for download failures
 */
export function handleDownloadError(error: Error, filename: string): void {
  console.error('Download failed:', error);
  
  // Show user-friendly error message
  alert(`Failed to download ${filename}. Please try again.`);
}

/**
 * Check if browser supports downloads
 * Validates browser capabilities before attempting download
 */
export function canDownload(): boolean {
  return typeof document !== 'undefined' && 'createElement' in document;
}

/**
 * Get download statistics for analytics
 * Tracks download patterns for improvement insights
 */
export interface DownloadStats {
  totalDownloads: number;
  documentTypes: Record<DocumentType, number>;
  averageFileSize: number;
}

export function getDownloadStats(documents: GeneratedDocument[]): DownloadStats {
  const stats: DownloadStats = {
    totalDownloads: documents.length,
    documentTypes: {
      germanCV: 0,
      englishCV: 0,
      germanCoverLetter: 0,
      englishCoverLetter: 0
    },
    averageFileSize: 0
  };
  
  let totalSize = 0;
  
  documents.forEach(doc => {
    stats.documentTypes[doc.type]++;
    totalSize += doc.pdfBlob.size;
  });
  
  stats.averageFileSize = documents.length > 0 ? totalSize / documents.length : 0;
  
  return stats;
}

/**
 * Validate file before download
 * Ensures file integrity before download
 */
export function validateFileForDownload(pdfBlob: Blob): boolean {
  // Check if blob exists and has content
  if (!pdfBlob || pdfBlob.size === 0) {
    return false;
  }
  
  // Check if it's a PDF (basic check)
  if (pdfBlob.type && !pdfBlob.type.includes('pdf')) {
    console.warn('File may not be a valid PDF');
  }
  
  // Check reasonable file size (between 10KB and 10MB)
  const minSize = 10 * 1024; // 10KB
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (pdfBlob.size < minSize || pdfBlob.size > maxSize) {
    console.warn(`Unusual file size: ${pdfBlob.size} bytes`);
  }
  
  return true;
}

/**
 * Batch download multiple files with delay
 * Downloads multiple files with small delays to avoid browser blocking
 */
export async function batchDownload(
  documents: GeneratedDocument[],
  userName: string,
  companyName: string,
  jobTitle?: string,
  delayMs: number = 500
): Promise<void> {
  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];
    const filename = generateFilename(document.type, userName, companyName, jobTitle);
    
    if (validateFileForDownload(document.pdfBlob)) {
      downloadPDF(document.pdfBlob, filename);
      showDownloadConfirmation(filename);
      
      // Add delay between downloads (except for the last one)
      if (i < documents.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } else {
      handleDownloadError(new Error('Invalid file'), filename);
    }
  }
}