# CV + Cover Letter Generator - Requirements (User-Controlled)

## Introduction

A **simple web application** that lets users generate tailored CVs and cover letters selectively in German or English.

**Core Flow:**
```
1. User enters professional profile (saved to localStorage)
2. User pastes job description
3. AI analyzes job requirements (Perplexity)
4. User SELECTS what to generate:
   - [✓] German CV (2 pages max)
   - [ ] English CV (2 pages max)
   - [ ] German Cover Letter (1 page)
   - [ ] English Cover Letter (1 page)
5. System generates ONLY selected documents
6. User previews each document
7. User downloads approved documents
```

**Key Principles:**
- User controls what gets generated (no automatic generation)
- Preview before download (mandatory)
- Strict page limits (CV = 2 pages, Letter = 1 page)
- No authentication, no database, just localStorage

## Glossary

- **System**: The CV and Cover Letter Generator web application
- **User**: The person using the application to generate documents
- **Profile**: User's professional information stored in localStorage
- **Job_Analysis**: AI-powered analysis of job descriptions using Perplexity API
- **Document_Generator**: Component that creates PDF documents
- **Preview_Modal**: Full-screen PDF preview interface
- **Selection_Interface**: Checkbox interface for document selection

## Requirements

### Requirement 1: Enter Professional Profile

**User Story:** As a user, I want to enter my profile once, so that I can generate multiple documents without re-entering data.

#### Acceptance Criteria

1. WHEN a user visits the application, THE System SHALL display /profile page with sections for header, profile summary, experience entries, education entries, skills, languages, and references
2. WHEN user enters data, THE System SHALL auto-save to localStorage with 1-second debounce
3. WHEN user returns to profile page, THE System SHALL load previously saved data from localStorage
4. THE System SHALL display header section with name, title, location, phone, email, LinkedIn, GitHub fields
5. THE System SHALL provide character counter for job description textarea with 10,000 character limit

### Requirement 2: Paste Job Description & Analyze

**User Story:** As a user with complete profile, I want to paste job description and get AI analysis, so that I know which keywords to emphasize.

#### Acceptance Criteria

1. WHEN user navigates to /generate page, THE System SHALL display large textarea for job description and "Analyze Job" button
2. WHEN user clicks "Analyze Job", THE System SHALL show loading state "Analyzing job requirements..." and call Perplexity API
3. WHEN analysis completes, THE System SHALL extract job title, company name, must-have keywords, preferred keywords, nice-to-have keywords, and language requirement
4. WHEN displaying results, THE System SHALL show color-coded keyword badges: red for must-have, amber for preferred, green for nice-to-have
5. WHEN analysis completes, THE System SHALL complete processing in under 5 seconds

### Requirement 3: Select Documents to Generate

**User Story:** As a user with analyzed job, I want to choose which documents to generate, so that I only create what I need.

#### Acceptance Criteria

1. WHEN job analysis is complete, THE System SHALL display checkboxes for German CV (2 pages), English CV (2 pages), German Cover Letter (1 page), and English Cover Letter (1 page)
2. WHEN no checkboxes are selected, THE System SHALL keep "Generate Selected Documents" button disabled
3. WHEN at least one checkbox is selected, THE System SHALL enable "Generate Selected Documents" button
4. WHEN user clicks generate button, THE System SHALL create only the checked documents
5. THE System SHALL never automatically generate all documents without user selection
### Requirement 4: Document Generation with Page Limits

**User Story:** As a user, I want generated documents to respect strict page limits, so that they meet professional standards and requirements.

#### Acceptance Criteria

1. WHEN generating a CV, THE Document_Generator SHALL enforce maximum 2 pages strictly
2. WHEN generating a cover letter, THE Document_Generator SHALL enforce maximum 1 page strictly
3. WHEN CV content exceeds 2 pages, THE System SHALL reduce bullets per experience to 6, then 5, then remove oldest experience until under 2 pages
4. WHEN cover letter exceeds 1 page, THE System SHALL adjust font size and spacing to fit within 1 page
5. THE System SHALL never produce documents exceeding specified page limits under any circumstances

### Requirement 5: Preview Generated Documents

**User Story:** As a user with generated documents, I want to preview each document before downloading, so that I can verify quality.

#### Acceptance Criteria

1. WHEN documents are generated, THE System SHALL display /results page with list of generated documents only
2. WHEN displaying each document, THE System SHALL show document name, page count, keyword match score, Preview button, and Download PDF button
3. WHEN user clicks Preview button, THE System SHALL open full-screen preview modal with PDF viewer
4. WHEN in preview mode, THE System SHALL provide page navigation, zoom controls, and Close/Download buttons
5. THE System SHALL use browser's native PDF viewer for preview functionality

### Requirement 6: Download Selected Documents

**User Story:** As a user satisfied with previews, I want to download documents, so that I can use them for applications.

#### Acceptance Criteria

1. WHEN user clicks Download PDF, THE System SHALL trigger browser download with proper filename format
2. WHEN downloading German CV, THE System SHALL use format: Lebenslauf_Niranjan_Thimmappa_[Company]_[YYYY-MM-DD].pdf
3. WHEN downloading German cover letter, THE System SHALL use format: Anschreiben_Niranjan_Thimmappa_[Company]_[YYYY-MM-DD].pdf
4. WHEN downloading English CV, THE System SHALL use format: Resume_Niranjan_Thimmappa_[Company]_[YYYY-MM-DD].pdf
5. WHEN multiple documents are generated, THE System SHALL provide "Download All as ZIP" button with properly named files

### Requirement 7: German CV Format Compliance

**User Story:** As a user generating German CV, I want exact format matching uploaded sample, so that it meets German professional standards.

#### Acceptance Criteria

1. WHEN generating German CV, THE System SHALL use exact structure: PROFIL, BERUFSERFAHRUNG, AUSBILDUNG, TECHNISCHE FÄHIGKEITEN & KOMPETENZEN, SPRACHKENNTNISSE, REFERENZEN
2. WHEN formatting header, THE System SHALL use: [NAME - 18pt bold], [Professional Title | Specialization - 12pt], [City, Country • Phone • Email • LinkedIn • GitHub]
3. WHEN creating experience section, THE System SHALL use format: [Job Title] | [Subtitle], [Company], [City], [MM/YYYY] – [MM/YYYY or "Heute"], with 6-8 categorized bullets per position
4. THE System SHALL use Helvetica or Arial font, 10-11pt body text, 0.5-0.75 inch margins, 1.0-1.15 line spacing
5. THE System SHALL enforce maximum 2 pages with content reduction algorithm if needed

### Requirement 8: German Cover Letter Format Compliance

**User Story:** As a user generating German cover letter, I want exact format matching uploaded sample, so that it meets German business standards.

#### Acceptance Criteria

1. WHEN generating German cover letter, THE System SHALL use exact structure with proper German business letter format
2. WHEN formatting header, THE System SHALL include: [Name], [Professional Title], [City], [Phone] | [Email], [LinkedIn] | [GitHub]
3. WHEN creating content, THE System SHALL use: "Sehr geehrte Damen und Herren," opening, 3-4 body paragraphs, "Mit freundlichen Grüßen" closing
4. THE System SHALL use formal German language (Sie form) with technical terms in English where standard
5. THE System SHALL enforce maximum 1 page with 400-500 words, Helvetica or Arial font, 10-11pt, 0.75-1.0 inch margins

### Requirement 9: English Document Formats

**User Story:** As a user generating English documents, I want professional English formatting, so that they work for international applications.

#### Acceptance Criteria

1. WHEN generating English CV, THE System SHALL use same structure as German CV but with English headers: PROFILE, PROFESSIONAL EXPERIENCE, EDUCATION, TECHNICAL SKILLS & COMPETENCIES, LANGUAGES, REFERENCES
2. WHEN generating English cover letter, THE System SHALL use "Dear Hiring Manager," opening and "Best regards," or "Sincerely," closing
3. THE System SHALL use professional business English with international audience focus
4. THE System SHALL maintain same page limits: CV maximum 2 pages, cover letter maximum 1 page
5. THE System SHALL use clear, concise language with same formatting standards as German documents

### Requirement 10: CV Tailoring Algorithm

**User Story:** As a user, I want my CV tailored to job requirements, so that it highlights relevant experience and skills.

#### Acceptance Criteria

1. WHEN tailoring CV content, THE System SHALL score experience bullets: must-have keywords +10 points, preferred +5 points, nice-to-have +2 points
2. WHEN selecting content, THE System SHALL sort bullets by relevance score and keep top 6-8 bullets per experience
3. WHEN rewriting summary, THE System SHALL incorporate top 5 matched keywords from job analysis
4. WHEN ordering skills, THE System SHALL reorder categories by keyword relevance to job requirements
5. THE System SHALL calculate and display match score as (matched keywords / total keywords) × 100

### Requirement 11: Data Persistence and Privacy

**User Story:** As a user, I want my data handled securely without requiring accounts, so that I can use the service privately and conveniently.

#### Acceptance Criteria

1. THE System SHALL store all profile data in browser localStorage only
2. THE System SHALL never require user authentication or account creation
3. THE System SHALL never store user data on external servers or databases
4. WHEN user clears browser data, THE System SHALL lose all stored profile information as expected
5. THE System SHALL only use Perplexity API for job analysis and never send personal profile data to external services