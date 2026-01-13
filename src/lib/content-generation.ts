import { UserProfile, JobAnalysis, TailoredContent } from '@/types';

/**
 * Generate cover letter content for both German and English
 * Uses job analysis and profile to create tailored cover letter text
 */
export async function generateCoverLetter(
  profile: UserProfile,
  jobAnalysis: JobAnalysis,
  tailoredContent: TailoredContent,
  language: 'German' | 'English'
): Promise<string> {
  const isGerman = language === 'German';
  
  // Extract key information
  const { name } = profile.header;
  const { jobTitle, companyName } = jobAnalysis;
  const topSkills = tailoredContent.reorderedSkills.slice(0, 3).map(cat => cat.name);
  const topKeywords = [
    ...jobAnalysis.mustHaveKeywords.slice(0, 3),
    ...jobAnalysis.preferredKeywords.slice(0, 2)
  ];
  
  if (isGerman) {
    return generateGermanCoverLetter(profile, jobAnalysis, tailoredContent, topSkills, topKeywords);
  } else {
    return generateEnglishCoverLetter(profile, jobAnalysis, tailoredContent, topSkills, topKeywords);
  }
}

/**
 * Generate German cover letter with proper business format
 */
function generateGermanCoverLetter(
  profile: UserProfile,
  jobAnalysis: JobAnalysis,
  tailoredContent: TailoredContent,
  topSkills: string[],
  topKeywords: string[]
): string {
  const { name, title, location, phone, email, linkedin, github } = profile.header;
  const { jobTitle, companyName } = jobAnalysis;
  const currentDate = new Date().toLocaleDateString('de-DE');
  
  // Header
  const header = `${name}
${title}
${location}
${phone} | ${email}
${linkedin} | ${github}

${companyName || 'Sehr geehrte Damen und Herren'}
${currentDate}

Bewerbung als ${jobTitle}`;

  // Opening paragraph
  const opening = `Sehr geehrte Damen und Herren,

mit großem Interesse habe ich Ihre Stellenausschreibung für die Position als ${jobTitle} gelesen. Als erfahrener Fachkraft mit umfassender Expertise in ${topSkills.join(', ')} bin ich überzeugt, dass ich eine wertvolle Ergänzung für Ihr Team darstellen würde.`;

  // Main body paragraphs
  const experience = `In meiner bisherigen Laufbahn konnte ich umfangreiche Erfahrungen in ${topKeywords.slice(0, 3).join(', ')} sammeln. Besonders hervorzuheben sind meine Kenntnisse in ${topSkills[0]}, die ich erfolgreich in verschiedenen Projekten eingesetzt habe. Meine Fähigkeiten in ${topKeywords.slice(3, 5).join(' und ')} ermöglichen es mir, komplexe Herausforderungen effizient zu lösen.`;

  const motivation = `Was mich besonders an dieser Position reizt, ist die Möglichkeit, meine Expertise in ${topSkills.slice(0, 2).join(' und ')} in einem innovativen Umfeld einzusetzen. Ihre Anforderungen an ${topKeywords[0]} und ${topKeywords[1]} entsprechen genau meinen Stärken und beruflichen Interessen.`;

  // Closing
  const closing = `Gerne überzeuge ich Sie in einem persönlichen Gespräch von meinen Qualifikationen und meiner Motivation. Über eine Einladung zu einem Vorstellungsgespräch würde ich mich sehr freuen.

Mit freundlichen Grüßen
${name}`;

  return `${header}

${opening}

${experience}

${motivation}

${closing}`;
}

/**
 * Generate English cover letter with professional format
 */
function generateEnglishCoverLetter(
  profile: UserProfile,
  jobAnalysis: JobAnalysis,
  tailoredContent: TailoredContent,
  topSkills: string[],
  topKeywords: string[]
): string {
  const { name, title, location, phone, email, linkedin, github } = profile.header;
  const { jobTitle, companyName } = jobAnalysis;
  const currentDate = new Date().toLocaleDateString('en-US');
  
  // Header
  const header = `${name}
${title}
${location}
${phone} | ${email}
${linkedin} | ${github}

${currentDate}

${companyName || 'Dear Hiring Manager'}
Subject: Application for ${jobTitle} Position`;

  // Opening paragraph
  const opening = `Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${companyName || 'your company'}. With extensive experience in ${topSkills.join(', ')}, I am confident that I would be a valuable addition to your team.`;

  // Main body paragraphs
  const experience = `Throughout my career, I have developed comprehensive expertise in ${topKeywords.slice(0, 3).join(', ')}. I have successfully applied my skills in ${topSkills[0]} across various projects, consistently delivering high-quality results. My proficiency in ${topKeywords.slice(3, 5).join(' and ')} enables me to tackle complex challenges efficiently.`;

  const motivation = `What particularly excites me about this role is the opportunity to leverage my expertise in ${topSkills.slice(0, 2).join(' and ')} in an innovative environment. Your requirements for ${topKeywords[0]} and ${topKeywords[1]} align perfectly with my core strengths and professional interests.`;

  // Closing
  const closing = `I would welcome the opportunity to discuss how my background and enthusiasm can contribute to your team's success. Thank you for considering my application, and I look forward to hearing from you.

Best regards,
${name}`;

  return `${header}

${opening}

${experience}

${motivation}

${closing}`;
}

/**
 * Translate content from English to German using simple translation patterns
 * This is a fallback function for when Perplexity API is not available
 */
export function translateWithPerplexity(englishText: string): Promise<string> {
  // Simple translation patterns for common CV/cover letter terms
  const translations: Record<string, string> = {
    'Professional Experience': 'Berufserfahrung',
    'Education': 'Ausbildung',
    'Skills': 'Fähigkeiten',
    'Languages': 'Sprachkenntnisse',
    'References': 'Referenzen',
    'Profile': 'Profil',
    'Technical Skills': 'Technische Fähigkeiten',
    'Technical Skills & Competencies': 'Technische Fähigkeiten & Kompetenzen',
    'Dear Hiring Manager': 'Sehr geehrte Damen und Herren',
    'Best regards': 'Mit freundlichen Grüßen',
    'Sincerely': 'Mit freundlichen Grüßen',
    'Present': 'Heute',
    'Current': 'Aktuell'
  };
  
  let translatedText = englishText;
  
  // Apply simple translations
  Object.entries(translations).forEach(([english, german]) => {
    const regex = new RegExp(english, 'gi');
    translatedText = translatedText.replace(regex, german);
  });
  
  return Promise.resolve(translatedText);
}

/**
 * Generate German content by translating English content
 * Uses translation patterns and German business conventions
 */
export async function generateGermanContent(
  englishContent: string,
  profile: UserProfile,
  jobAnalysis: JobAnalysis
): Promise<string> {
  // If content is already detected as German, return as-is
  if (isGerman(englishContent)) {
    return englishContent;
  }
  
  // Translate the content
  const translatedContent = await translateWithPerplexity(englishContent);
  
  // Apply German business formatting conventions
  const germanContent = translatedContent
    .replace(/Dear [^,]+,/g, 'Sehr geehrte Damen und Herren,')
    .replace(/Best regards|Sincerely/g, 'Mit freundlichen Grüßen')
    .replace(/\bI am\b/g, 'Ich bin')
    .replace(/\bI have\b/g, 'Ich habe')
    .replace(/\bmy\b/g, 'meine')
    .replace(/\byour\b/g, 'Ihre');
  
  return germanContent;
}

/**
 * Detect if content is in German language
 * Uses simple heuristics to identify German text
 */
export function isGerman(text: string): boolean {
  const germanIndicators = [
    'sehr geehrte',
    'mit freundlichen grüßen',
    'berufserfahrung',
    'ausbildung',
    'fähigkeiten',
    'sprachkenntnisse',
    'referenzen',
    'bewerbung',
    'stellenausschreibung',
    'vorstellungsgespräch',
    'heute',
    'ich bin',
    'ich habe',
    'meine',
    'ihre',
    'und',
    'der',
    'die',
    'das'
  ];
  
  const lowerText = text.toLowerCase();
  const matchCount = germanIndicators.filter(indicator => 
    lowerText.includes(indicator)
  ).length;
  
  // If more than 2 German indicators are found, consider it German
  return matchCount >= 2;
}

/**
 * Enhanced cover letter generation with AI assistance
 * This would integrate with Perplexity API for better content generation
 */
export async function generateCoverLetterWithAI(
  profile: UserProfile,
  jobAnalysis: JobAnalysis,
  tailoredContent: TailoredContent,
  language: 'German' | 'English'
): Promise<string> {
  // For now, use the template-based generation
  // In a full implementation, this would call Perplexity API
  // with a sophisticated prompt for cover letter generation
  
  return generateCoverLetter(profile, jobAnalysis, tailoredContent, language);
}

/**
 * Validate generated content meets requirements
 * Checks word count, format, and language consistency
 */
export function validateGeneratedContent(
  content: string,
  type: 'coverLetter' | 'summary',
  language: 'German' | 'English'
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  let isValid = true;
  
  // Word count validation
  const wordCount = content.split(/\s+/).length;
  
  if (type === 'coverLetter') {
    if (wordCount < 300) {
      warnings.push(`Cover letter is too short (${wordCount} words). Minimum 300 words recommended.`);
    }
    if (wordCount > 600) {
      warnings.push(`Cover letter is too long (${wordCount} words). Maximum 600 words recommended.`);
      isValid = false;
    }
  }
  
  if (type === 'summary') {
    if (wordCount < 30) {
      warnings.push(`Summary is too short (${wordCount} words). Minimum 30 words recommended.`);
    }
    if (wordCount > 100) {
      warnings.push(`Summary is too long (${wordCount} words). Maximum 100 words recommended.`);
      isValid = false;
    }
  }
  
  // Language consistency validation
  const detectedGerman = isGerman(content);
  const expectedGerman = language === 'German';
  
  if (detectedGerman !== expectedGerman) {
    warnings.push(`Language mismatch: Expected ${language} but detected ${detectedGerman ? 'German' : 'English'}`);
    isValid = false;
  }
  
  return { isValid, warnings };
}