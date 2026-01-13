# Requirements Document: ATS Compliance Enhancement

## Introduction

This specification defines comprehensive ATS (Applicant Tracking System) compliance requirements for the CV Generator to ensure generated resumes pass automated screening systems used by 98.4% of Fortune 500 companies and 75% of all employers in 2025.

**Critical Problem Identified:** CV-Generator currently produces beautiful resumes with Google Fonts (Open Sans) that display correctly but fail ATS text extraction due to CFF (Compact Font Format) encoding issues in @react-pdf/renderer (GitHub Issue #3047). This results in approximately 90% of user applications failing to parse properly, with ATS systems receiving garbled text like "îòðéðóð" instead of readable content.

**Solution Overview:** Three-phase implementation switching to standard PDF fonts (Helvetica), adding DOCX export capability, and implementing automated ATS compliance testing to achieve 85-95/100 Jobscan scores and 100% text extraction success.

## Glossary

- **ATS**: Applicant Tracking System - Software that automatically screens and ranks resumes
- **Parsing**: The process by which ATS extracts and categorizes information from resumes
- **Keyword_Matching**: Algorithm that compares resume content against job description requirements
- **Resume_Scoring**: ATS ranking system that assigns compatibility scores to applications
- **Document_Structure**: Standardized format that ensures reliable ATS parsing
- **Content_Optimization**: Strategic integration of job-relevant keywords and formatting
- **CFF_Encoding**: Compact Font Format encoding used by Google Fonts that causes text extraction failures
- **Standard_PDF_Fonts**: Built-in PDF fonts (Helvetica, Times-Roman, Courier) guaranteed for ATS compatibility
- **Text_Extraction**: Process by which ATS systems convert PDF content to searchable text
- **Jobscan_Score**: Industry-standard ATS compatibility rating (0-100, target ≥85)

## Requirements

### Requirement 1: File Format Compliance

**User Story:** As a job seeker, I want my resume to be saved in ATS-compatible file formats, so that automated systems can properly parse my information.

#### Acceptance Criteria

1. THE System SHALL generate resumes in .docx format as the primary ATS-compatible output
2. WHEN PDF format is requested, THE System SHALL create text-based PDFs using standard fonts only
3. THE System SHALL avoid image-based PDFs and custom font embedding that causes parsing failures
4. THE System SHALL include proper file naming conventions with candidate name and position
5. THE System SHALL maintain text selectability and extraction in all generated document formats
6. THE System SHALL achieve ≥85/100 Jobscan compatibility score for all generated files

### Requirement 2: Typography and Font Standards

**User Story:** As a job seeker, I want my resume to use ATS-friendly fonts and sizing, so that all text is properly recognized by parsing algorithms.

#### Acceptance Criteria

1. THE System SHALL use only standard PDF fonts: Helvetica, Times-Roman, or Courier (no Google Fonts)
2. THE System SHALL set body text font size between 10-12 points for optimal readability
3. THE System SHALL set header text font size between 14-16 points maximum
4. THE System SHALL eliminate all custom font dependencies that cause CFF encoding issues
5. THE System SHALL maintain consistent font usage throughout the document
6. THE System SHALL use pure black (#000000) text color for maximum ATS compatibility

### Requirement 3: Document Structure and Layout

**User Story:** As a job seeker, I want my resume to follow ATS-compatible structural standards, so that information is correctly categorized and parsed.

#### Acceptance Criteria

1. THE System SHALL use single-column layout exclusively
2. THE System SHALL avoid tables, text boxes, columns, and complex layouts
3. THE System SHALL place all content in the document body (not headers/footers)
4. THE System SHALL use standard section headers: "Professional Experience", "Education", "Skills", "Certifications"
5. THE System SHALL maintain consistent margins between 0.5-1 inch on all sides
6. THE System SHALL use reverse chronological order for experience and education sections

### Requirement 4: Content Formatting Standards

**User Story:** As a job seeker, I want my resume content to be formatted for optimal ATS parsing, so that all my qualifications are properly extracted.

#### Acceptance Criteria

1. THE System SHALL use standard bullet points (• or -) for lists
2. THE System SHALL avoid graphics, images, icons, charts, or visual elements
3. THE System SHALL use consistent date formatting (MM/YYYY or Month YYYY)
4. THE System SHALL left-align all text content
5. THE System SHALL use adequate white space between sections for parsing clarity
6. THE System SHALL avoid underlining, italics, or excessive text formatting

### Requirement 5: Keyword Optimization Engine

**User Story:** As a job seeker, I want my resume to include relevant keywords from job descriptions, so that I achieve higher ATS matching scores.

#### Acceptance Criteria

1. WHEN a job description is provided, THE System SHALL extract must-have, preferred, and nice-to-have keywords
2. THE System SHALL integrate keywords naturally throughout resume content without keyword stuffing
3. THE System SHALL include exact job title matches in professional summary or headline
4. THE System SHALL incorporate industry-standard terminology and technical skills
5. THE System SHALL maintain keyword density between 2-4% of total content
6. THE System SHALL provide keyword match scoring and optimization suggestions

### Requirement 6: Contact Information Standards

**User Story:** As a job seeker, I want my contact information to be properly formatted for ATS parsing, so that recruiters can easily reach me.

#### Acceptance Criteria

1. THE System SHALL place full name prominently at the top using larger font size
2. THE System SHALL include phone number, email, city/state, and LinkedIn URL as plain text
3. THE System SHALL avoid placing contact information in headers or footers
4. THE System SHALL format LinkedIn URLs as complete, unlinked text strings
5. THE System SHALL exclude unnecessary contact methods (fax, personal websites unless relevant)
6. THE System SHALL validate email format and phone number structure

### Requirement 7: Professional Summary Optimization

**User Story:** As a job seeker, I want an ATS-optimized professional summary, so that key qualifications are immediately visible to both systems and recruiters.

#### Acceptance Criteria

1. THE System SHALL create 3-5 sentence professional summaries with target job titles
2. THE System SHALL integrate 5-8 relevant keywords naturally within summary content
3. THE System SHALL include quantifiable achievements and core competencies
4. THE System SHALL avoid generic language in favor of specific, measurable accomplishments
5. THE System SHALL position summary immediately after contact information

### Requirement 8: Skills Section Enhancement

**User Story:** As a job seeker, I want a strategically organized skills section, so that ATS systems can easily identify my technical competencies.

#### Acceptance Criteria

1. THE System SHALL create dedicated "Skills" or "Core Competencies" section early in resume
2. THE System SHALL categorize skills by type (Technical, Software, Industry-specific)
3. THE System SHALL include both acronyms and full terms (e.g., "CRM (Customer Relationship Management)")
4. THE System SHALL prioritize job-relevant skills based on keyword analysis
5. THE System SHALL limit skills section to 3-4 categories with 4-6 items each

### Requirement 9: Experience Section Optimization

**User Story:** As a job seeker, I want my work experience optimized for ATS parsing, so that my career progression and achievements are properly recognized.

#### Acceptance Criteria

1. THE System SHALL format job titles, company names, and dates consistently
2. THE System SHALL create 3-5 achievement-focused bullet points per position
3. THE System SHALL begin bullet points with strong action verbs
4. THE System SHALL include quantifiable results and metrics where possible
5. THE System SHALL integrate relevant keywords naturally within job descriptions
6. THE System SHALL maintain reverse chronological order

### Requirement 10: Education and Certification Standards

**User Story:** As a job seeker, I want my educational background formatted for ATS compatibility, so that my qualifications are properly categorized.

#### Acceptance Criteria

1. THE System SHALL include degree type, major, institution name, and graduation date
2. THE System SHALL format education entries consistently with clear hierarchy
3. THE System SHALL include relevant certifications with issuing authorities and dates
4. THE System SHALL use standard terminology for degrees and certifications
5. THE System SHALL include license numbers and expiration dates where applicable

### Requirement 11: ATS Testing and Validation

**User Story:** As a job seeker, I want to verify my resume's ATS compatibility, so that I can be confident it will pass automated screening.

#### Acceptance Criteria

1. THE System SHALL provide copy-paste text extraction testing functionality
2. THE System SHALL offer Jobscan integration for real-time compatibility scoring
3. THE System SHALL generate ATS compatibility scores ≥85/100 and provide recommendations
4. THE System SHALL identify and prevent garbled text extraction (îòðéðóð patterns)
5. THE System SHALL provide before/after optimization comparisons with measurable improvements

### Requirement 12: Multi-ATS System Compatibility

**User Story:** As a job seeker, I want my resume to work across different ATS platforms, so that I can apply to various companies with confidence.

#### Acceptance Criteria

1. THE System SHALL ensure compatibility with major ATS platforms (Workday, Greenhouse, Taleo, iCIMS)
2. THE System SHALL test parsing accuracy across different system types
3. THE System SHALL provide platform-specific optimization recommendations
4. THE System SHALL maintain universal formatting standards that work across all systems
5. THE System SHALL offer troubleshooting guidance for common ATS issues

### Requirement 13: Content Length and Density Optimization

**User Story:** As a job seeker, I want my resume optimized for ideal length and content density, so that it provides comprehensive information without overwhelming ATS systems.

#### Acceptance Criteria

1. THE System SHALL limit resumes to 1-2 pages based on experience level
2. THE System SHALL optimize content density for maximum keyword inclusion
3. THE System SHALL prioritize most relevant information in the first page
4. THE System SHALL eliminate redundant or low-value content
5. THE System SHALL maintain readability while maximizing ATS performance

### Requirement 14: Industry-Specific ATS Optimization

**User Story:** As a job seeker, I want industry-specific ATS optimization, so that my resume uses appropriate terminology and formatting for my target field.

#### Acceptance Criteria

1. THE System SHALL provide industry-specific keyword databases (Technology, Healthcare, Finance, etc.)
2. THE System SHALL adapt formatting requirements based on industry standards
3. THE System SHALL include field-specific sections (Licenses for Healthcare, Technical Skills for IT)
4. THE System SHALL use appropriate professional terminology and acronyms
5. THE System SHALL provide industry-specific optimization templates

### Requirement 15: Real-time ATS Feedback

**User Story:** As a job seeker, I want real-time feedback on ATS compatibility, so that I can make immediate improvements to my resume.

#### Acceptance Criteria

1. THE System SHALL provide live ATS scoring as content is modified
2. THE System SHALL highlight potential parsing issues in real-time
3. THE System SHALL suggest keyword improvements based on job description analysis
4. THE System SHALL offer formatting corrections with explanations
5. THE System SHALL display compatibility status for different ATS platforms

### Requirement 16: Font System Overhaul

**User Story:** As a job seeker, I want my resume to use fonts that guarantee ATS compatibility, so that my applications are never filtered out due to parsing failures.

#### Acceptance Criteria

1. THE System SHALL use only standard PDF fonts: Helvetica, Times-Roman, or Courier
2. THE System SHALL eliminate all Google Font dependencies from PDF generation
3. THE System SHALL implement centralized font configuration module
4. THE System SHALL validate font compliance before PDF generation
5. THE System SHALL ensure pure black (#000000) text color for maximum readability
6. THE System SHALL maintain consistent font sizing (10-12pt body, 14-16pt headers)

### Requirement 17: Text Extraction Validation

**User Story:** As a job seeker, I want to verify that my resume text can be properly extracted, so that I know ATS systems will read it correctly.

#### Acceptance Criteria

1. THE System SHALL provide copy-paste text extraction testing functionality
2. THE System SHALL detect and prevent garbled character encoding (îòðéðóð patterns)
3. THE System SHALL validate 100% text extraction success rate
4. THE System SHALL compare extracted text with original content for accuracy
5. THE System SHALL provide plain text preview of ATS-readable content

### Requirement 18: Dual Format Export System

**User Story:** As a job seeker, I want to download my resume in both PDF and DOCX formats, so that I can choose the best format for each application.

#### Acceptance Criteria

1. THE System SHALL generate both PDF and DOCX versions with identical content
2. THE System SHALL provide separate download buttons for each format
3. THE System SHALL ensure DOCX format uses standard fonts and formatting
4. THE System SHALL maintain content consistency between both formats
5. THE System SHALL validate both formats achieve ≥85/100 Jobscan scores

### Requirement 19: Automated Compliance Testing

**User Story:** As a system administrator, I want automated ATS compliance testing, so that regressions are prevented and compliance is maintained.

#### Acceptance Criteria

1. THE System SHALL implement automated font compliance validation in CI/CD pipeline
2. THE System SHALL run text extraction tests on every build
3. THE System SHALL validate Jobscan scores meet minimum thresholds (≥85/100)
4. THE System SHALL prevent deployment if ATS compliance tests fail
5. THE System SHALL generate compliance reports and metrics

### Requirement 20: Performance and Compatibility Monitoring

**User Story:** As a product manager, I want to monitor ATS performance metrics, so that I can track improvement and identify issues.

#### Acceptance Criteria

1. THE System SHALL track user interview rate improvements (target: 12-15%)
2. THE System SHALL monitor ATS-related support ticket volume
3. THE System SHALL measure format adoption rates (PDF vs DOCX usage)
4. THE System SHALL provide ATS compatibility dashboard with real-time metrics
5. THE System SHALL alert on compliance score degradation below thresholds