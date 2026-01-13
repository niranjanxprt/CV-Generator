# Implementation Plan: CV + Cover Letter Generator

## Overview

This implementation plan breaks down the CV and Cover Letter Generator into discrete coding tasks that build incrementally. Each task focuses on specific functionality with clear requirements validation. The system will be built using Next.js 15, TypeScript, and @react-pdf/renderer with user-controlled document generation and mandatory preview functionality.

## Tasks

- [x] 1. Set up project structure and core dependencies
  - Initialize Next.js 15 project with TypeScript and App Router
  - Install and configure dependencies: Tailwind CSS, shadcn/ui, @react-pdf/renderer, React Hook Form, Zod, fast-check, JSZip, react-swipeable
  - Set up folder structure: /app, /components, /lib, /types
  - Configure environment variables for PERPLEXITY_API_KEY
  - _Requirements: Foundation for all functionality_

- [-] 2. Implement core data models and types
  - Create TypeScript interfaces for UserProfile, JobAnalysis, DocumentRequest, TailoredContent
  - Define CategorizedBullet interface with categoryLabel and description fields
  - Create Zod validation schemas for profile data and job descriptions
  - Implement utility functions: groupBy, extractTopKeywords, hashString
  - _Requirements: 1.1, 2.2, 11.1_

- [-] 2.1 Write property test for data model validation
  - **Property 1: Profile Data Persistence Round Trip**
  - **Validates: Requirements 1.2, 1.3**

- [ ] 3. Create profile management system
  - Build ProfileForm component with sections: header, summary, experience, education, skills, languages, references
  - Implement auto-save to localStorage with 1-second debounce using React Hook Form
  - Add visual "Saved" indicator when auto-save completes
  - Create profile loading functionality with version migration support
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 3.1 Write property test for auto-save debouncing
  - **Property 2: Auto-save Debouncing**
  - **Validates: Requirements 1.2**

- [ ] 3.2 Write unit tests for profile form validation
  - Test required field validation and form submission
  - Test localStorage quota exceeded handling
  - _Requirements: 1.6, 11.7_

- [ ] 4. Implement Perplexity API integration
  - Create analyzeJobWithPerplexity function with proper request/response handling
  - Implement RateLimiter class for API call management
  - Add error handling for network failures, timeouts, and invalid responses
  - Create job analysis caching system using session storage
  - _Requirements: 2.4, 2.5, 2.7, 2.8_

- [ ] 4.1 Write property test for keyword extraction
  - **Property 5: Keyword Extraction and Display**
  - **Validates: Requirements 2.5, 2.6**

- [ ] 4.2 Write unit tests for API error handling
  - Test network failures, timeout scenarios, and malformed responses
  - Test rate limiting functionality
  - _Requirements: 12.1, 12.2, 12.7_

- [ ] 5. Build job analysis and document selection interface
  - Create GeneratePage with job description textarea and character counter
  - Implement input validation for minimum 50 characters
  - Build keyword display with color-coded badges (red/amber/green)
  - Create document selection checkboxes with enable/disable logic for generate button
  - Add KeywordMatchDisplay component showing matched/missing keywords
  - _Requirements: 2.1, 2.2, 2.3, 2.6, 3.1, 3.2, 3.3, 10.9_

- [ ] 5.1 Write property test for input validation
  - **Property 4: Input Validation Consistency**
  - **Validates: Requirements 2.3**

- [ ] 5.2 Write property test for character counter
  - **Property 3: Character Counter Accuracy**
  - **Validates: Requirements 2.2**

- [ ] 6. Implement CV tailoring algorithm
  - Create calculateBulletScore function with keyword scoring (must-have +10, preferred +5, nice-to-have +2)
  - Implement tailorCVContent function with bullet selection and sorting
  - Build rewriteSummary function using Perplexity API for content enhancement
  - Create reorderSkillsByRelevance function for skills categorization
  - Implement calculateMatchScore function for keyword match percentage
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.8_

- [ ] 6.1 Write property test for CV tailoring algorithm
  - **Property 12: CV Tailoring Algorithm Correctness**
  - **Validates: Requirements 10.1, 10.2, 10.3**

- [ ] 7. Create German and English content generation
  - Implement generateCoverLetter function for both languages using Perplexity API
  - Build translateWithPerplexity function for German content translation
  - Create generateGermanContent function with language detection
  - Add isGerman utility function for content language detection
  - _Requirements: 8.2, 8.5, 9.2, 9.4_

- [ ] 7.1 Write unit tests for content generation
  - Test cover letter generation for both languages
  - Test translation functionality and language detection
  - _Requirements: 8.2, 9.2_

- [ ] 8. Build PDF generation system with format templates
  - Create GermanCVPDF component matching exact uploaded sample format
  - Build GermanCoverLetterPDF component with proper business letter structure
  - Implement EnglishCVPDF and EnglishCoverLetterPDF components
  - Add PDF styling with correct fonts, margins, and spacing
  - _Requirements: 7.1, 7.2, 7.3, 7.7, 8.1, 8.3, 8.4, 9.1, 9.3_

- [ ] 8.1 Write property test for document structure
  - **Property 11: German Document Structure Compliance**
  - **Validates: Requirements 7.1, 8.1**

- [ ] 9. Implement page limit enforcement system
  - Create getActualPageCount function using @react-pdf/renderer and pdf-lib
  - Build enforceCVPageLimit function with content reduction algorithm
  - Implement enforceCoverLetterPageLimit function with spacing/font adjustments
  - Add reduceBulletsPerExperience and trimCoverLetterContent functions
  - Create robust fallback handling for unsolvable page limit cases
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7_

- [ ] 9.1 Write property test for page limit enforcement
  - **Property 7: Page Limit Enforcement**
  - **Validates: Requirements 4.1, 4.2**

- [ ] 9.2 Write property test for content reduction algorithm
  - **Property 8: Content Reduction Algorithm**
  - **Validates: Requirements 4.3**

- [ ] 10. Create document generation and results system
  - Build document generation pipeline that creates only selected documents
  - Implement ResultsPage component with document list and metadata display
  - Add document generation progress indicators and success messaging
  - Create document metadata display showing page count and match score
  - _Requirements: 3.4, 4.7, 5.1, 5.2, 12.6_

- [ ] 10.1 Write property test for selective generation
  - **Property 6: Selective Document Generation**
  - **Validates: Requirements 3.4**

- [ ] 10.2 Write property test for document metadata
  - **Property 9: Document Metadata Display**
  - **Validates: Requirements 5.2**

- [ ] 11. Build preview system with mobile support
  - Create PreviewModal component with full-screen PDF viewer
  - Implement swipe gesture support using react-swipeable for mobile navigation
  - Add page navigation controls and zoom functionality
  - Build keyboard navigation support (Esc to close, arrows for pages)
  - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.8, 14.4_

- [ ] 11.1 Write unit tests for preview functionality
  - Test modal opening/closing and navigation controls
  - Test mobile swipe gestures and keyboard navigation
  - _Requirements: 5.3, 5.8, 14.4_

- [ ] 12. Implement download and file management
  - Create download functionality with proper filename generation
  - Build generateFilename function following exact format requirements
  - Implement generateZipFile function for multiple document downloads
  - Add download confirmation messaging and error handling
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8_

- [ ] 12.1 Write property test for filename format
  - **Property 10: Filename Format Compliance**
  - **Validates: Requirements 6.1**

- [ ] 13. Add comprehensive error handling and user feedback
  - Implement error handlers for all error types (network, API, storage, PDF generation)
  - Create loading states and progress indicators for async operations
  - Add success/error toast notifications and retry functionality
  - Build offline detection and appropriate user messaging
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

- [ ] 13.1 Write unit tests for error handling
  - Test all error scenarios and recovery paths
  - Test loading states and user feedback mechanisms
  - _Requirements: 12.1, 12.2, 12.3, 12.9_

- [ ] 14. Implement responsive design and mobile optimization
  - Create responsive layouts for all pages (375px to 1920px+)
  - Optimize mobile forms with proper input sizing and touch targets
  - Add responsive font sizes and mobile-friendly navigation
  - Test and optimize for iOS Safari and Android Chrome
  - _Requirements: 14.1, 14.2, 14.3, 14.6, 14.7, 14.8, 14.9_

- [ ] 14.1 Write unit tests for responsive design
  - Test layout behavior at different screen sizes
  - Test touch-friendly button sizing and mobile interactions
  - _Requirements: 14.2, 14.3_

- [ ] 15. Add performance optimization and caching
  - Implement code splitting for preview modal and PDF generation components
  - Add lazy loading for heavy components and API response caching
  - Optimize localStorage operations with proper debouncing
  - Add performance monitoring for page load and generation times
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9_

- [ ] 15.1 Write performance tests
  - Test page load times and PDF generation performance
  - Test localStorage operations and caching effectiveness
  - _Requirements: 15.1, 15.2, 15.3_

- [ ] 16. Final integration and testing
  - Run all property-based tests with 100+ iterations each
  - Execute comprehensive browser compatibility testing
  - Perform end-to-end testing of complete user workflows
  - Validate all 15 requirements with acceptance testing scenarios
  - _Requirements: All requirements validation_

- [ ] 16.1 Execute all property-based tests
  - Run complete test suite with fast-check library
  - Validate all 13 correctness properties
  - **Validates: All property requirements**

- [ ] 17. Deployment and production setup
  - Configure Vercel deployment with environment variables
  - Set up production build optimization and error monitoring
  - Validate all functionality in production environment
  - Create deployment documentation and API key setup instructions
  - _Requirements: Production deployment_

## Notes

- All tasks are required for comprehensive implementation from start
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and error conditions
- All PDF generation must enforce strict page limits (CV: 2 pages, Cover Letter: 1 page)
- German documents must match uploaded sample formats exactly
- All personal data remains in localStorage only (privacy-first approach)