// Core data types for the CV Generator

export interface UserProfile {
  header: {
    name: string;
    title: string;
    location: string;
    phone: string;
    email: string;
    linkedin: string;
    github: string;
    photo?: string; // Base64 image data or URL
  };
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillCategory[];
  languages: LanguageEntry[];
  references: ReferenceEntry[];
}

export interface ExperienceEntry {
  id: string;
  jobTitle: string;
  subtitle?: string; // For German format: "Python-Entwicklung & Echtzeitsysteme"
  company: string;
  location: string;
  startDate: string; // MM/YYYY format
  endDate: string; // MM/YYYY or "Heute"/"Present"
  bullets: CategorizedBullet[];
}

export interface CategorizedBullet {
  id: string;
  categoryLabel: string; // e.g., "Python-Anwendungsentwicklung"
  description: string; // Achievement text
  keywords?: string[]; // For scoring
  score?: number; // Calculated during tailoring
}

export interface EducationEntry {
  id: string;
  degree: string;
  field: string;
  institution: string;
  startDate: string;
  endDate: string;
  details?: string;
}

export interface SkillCategory {
  id: string;
  name: string; // e.g., "Python-Entwicklung", "DevOps & Tools"
  skills: Skill[];
  relevanceScore?: number; // For reordering
}

export interface Skill {
  name: string;
  description: string;
  keywords: string[];
}

export interface LanguageEntry {
  id: string;
  name: string;
  proficiency: string; // e.g., "B2 – Fließend (Berufstauglich)"
}

export interface ReferenceEntry {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
}

// Job Analysis Types
export interface JobAnalysis {
  jobTitle: string;
  companyName: string;
  mustHaveKeywords: string[];
  preferredKeywords: string[];
  niceToHaveKeywords: string[];
  languageRequirement: 'German' | 'English' | 'Both';
}

export interface KeywordScore {
  keyword: string;
  type: 'mustHave' | 'preferred' | 'niceToHave';
  matched: boolean;
}

// Document Generation Types
export type DocumentType = 'germanCV' | 'englishCV' | 'germanCoverLetter' | 'englishCoverLetter';

export interface DocumentRequest {
  type: DocumentType;
  profile: UserProfile;
  jobAnalysis: JobAnalysis;
  tailoredContent: TailoredContent;
}

export interface TailoredContent {
  summary: string;
  topBullets: CategorizedBullet[];
  reorderedSkills: SkillCategory[];
  matchScore: number;
}

export interface GeneratedDocument {
  id: string;
  type: DocumentType;
  name: string;
  pageCount: number;
  matchScore: number;
  pdfBlob: Blob;
  warnings: string[];
}

// Storage Types
export interface StoredProfile {
  version: string; // For future migrations
  lastUpdated: string;
  profile: UserProfile;
}

// API Types
export interface PerplexityRequest {
  model: 'llama-3.1-sonar-large-128k-online';
  messages: Array<{
    role: 'system' | 'user';
    content: string;
  }>;
  temperature: 0.2;
  max_tokens: 2000;
}

// Error Types
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_TIMEOUT = 'API_TIMEOUT',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  PDF_GENERATION_FAILED = 'PDF_GENERATION_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  CV_PARSING_ERROR = 'CV_PARSING_ERROR'
}

export interface ErrorHandler {
  type: ErrorType;
  message: string;
  action: 'retry' | 'redirect' | 'ignore';
  retryable: boolean;
}

// CV Import Types
export interface CVImportRequest {
  file: File;
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'doc' | 'docx';
}

export interface CVParsingResult {
  success: boolean;
  extractedText: string;
  parsedProfile: Partial<UserProfile>;
  confidence: number; // 0-100 percentage
  warnings: string[];
  errors: string[];
}

export interface FileUploadState {
  isUploading: boolean;
  isParsing: boolean;
  progress: number;
  error: string | null;
  result: CVParsingResult | null;
}