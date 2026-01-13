import { UserProfile, JobAnalysis, CategorizedBullet, SkillCategory, TailoredContent } from '@/types';
import { analyzeJobWithPerplexity } from './perplexity';
import { calculateSemanticBulletScore, calculateSemanticMatchScore, suggestKeywordEnhancements } from './semantic-similarity';
import { calculateSmartBulletScore, calculateSmartMatchScore, suggestSmartKeywordEnhancements, enhanceBulletWithSmartKeywords } from './smart-keyword-matching';

/**
 * Calculate relevance score for a bullet point based on job keywords
 * Must-have keywords: +10 points
 * Preferred keywords: +5 points  
 * Nice-to-have keywords: +2 points
 */
export function calculateBulletScore(bullet: CategorizedBullet, jobAnalysis: JobAnalysis): number {
  let score = 0;
  const bulletText = `${bullet.categoryLabel} ${bullet.description}`.toLowerCase();
  
  // Check must-have keywords
  for (const keyword of jobAnalysis.mustHaveKeywords) {
    if (bulletText.includes(keyword.toLowerCase())) {
      score += 10;
    }
  }
  
  // Check preferred keywords
  for (const keyword of jobAnalysis.preferredKeywords) {
    if (bulletText.includes(keyword.toLowerCase())) {
      score += 5;
    }
  }
  
  // Check nice-to-have keywords
  for (const keyword of jobAnalysis.niceToHaveKeywords) {
    if (bulletText.includes(keyword.toLowerCase())) {
      score += 2;
    }
  }
  
  return score;
}

/**
 * Enhanced CV tailoring with smart semantic matching and keyword integration
 * Uses both rule-based semantic matching and optional Hugging Face embeddings
 */
export async function enhancedTailorCVContent(profile: UserProfile, jobAnalysis: JobAnalysis): Promise<UserProfile> {
  const tailoredProfile = { ...profile };
  
  // Process each experience entry with enhanced bullet points
  for (let expIndex = 0; expIndex < profile.experience.length; expIndex++) {
    const exp = profile.experience[expIndex];
    
    // Score all bullets using smart semantic matching (primary) - DISABLE semantic similarity for now
    const scoredBullets = await Promise.all(
      exp.bullets.map(async (bullet) => {
        // Use only smart matching (works without API and doesn't expand content)
        const smartScore = calculateSmartBulletScore(bullet, jobAnalysis);
        
        // TEMPORARILY DISABLED: semantic similarity to prevent content expansion
        // let finalScore = smartScore;
        // try {
        //   const semanticScore = await calculateSemanticBulletScore(bullet, jobAnalysis);
        //   // Use the higher score, but prefer smart matching if close
        //   finalScore = semanticScore > smartScore * 1.2 ? semanticScore : smartScore;
        // } catch (error) {
        //   // Fallback to smart matching if semantic fails
        //   finalScore = smartScore;
        // }
        
        return {
          ...bullet,
          score: smartScore
        };
      })
    );
    
    // Enhance bullets with smart keyword suggestions - MINIMAL enhancement only
    const enhancedBullets = await Promise.all(
      scoredBullets.map(async (bullet) => {
        // Get smart keyword suggestions (always available) - but limit to 1 suggestion
        const smartSuggestions = suggestSmartKeywordEnhancements(
          `${bullet.categoryLabel} ${bullet.description}`,
          jobAnalysis
        ).slice(0, 1); // Only take the first suggestion to minimize expansion
        
        // TEMPORARILY DISABLED: semantic suggestions to prevent content expansion
        // let allSuggestions = smartSuggestions;
        // try {
        //   const semanticSuggestions = await suggestKeywordEnhancements(
        //     `${bullet.categoryLabel} ${bullet.description}`,
        //     jobAnalysis
        //   );
        //   // Combine suggestions, prioritizing smart ones
        //   allSuggestions = [...new Set([...smartSuggestions, ...semanticSuggestions])];
        // } catch (error) {
        //   // Use only smart suggestions if semantic fails
        //   allSuggestions = smartSuggestions;
        // }
        
        // Apply minimal smart enhancements
        const enhancedBullet = enhanceBulletWithSmartKeywords(bullet, smartSuggestions);
        
        // Recalculate score with enhanced content
        const finalScore = calculateSmartBulletScore(enhancedBullet, jobAnalysis);
        
        return {
          ...enhancedBullet,
          score: finalScore
        };
      })
    );
    
    // Sort by score (highest first) and take top 4-6 (reduced from 6-8)
    const sortedBullets = enhancedBullets.sort((a, b) => (b.score || 0) - (a.score || 0));
    const maxBullets = Math.min(6, Math.max(4, sortedBullets.length));
    
    tailoredProfile.experience[expIndex] = {
      ...exp,
      bullets: sortedBullets.slice(0, maxBullets)
    };
  }
  
  return tailoredProfile;
}

/**
 * Enhanced bullet point rewriting to incorporate missing keywords
 * Rewrites bullet points to naturally include job-relevant keywords
 */
export async function enhanceBulletPoints(
  bullets: CategorizedBullet[],
  jobAnalysis: JobAnalysis,
  profile: UserProfile
): Promise<CategorizedBullet[]> {
  const allJobKeywords = [
    ...jobAnalysis.mustHaveKeywords,
    ...jobAnalysis.preferredKeywords,
    ...jobAnalysis.niceToHaveKeywords
  ];

  // Create keyword mapping for technical terms
  const keywordEnhancements: Record<string, string[]> = {
    'python': ['GPU acceleration', 'optimising performance', 'distributed training', 'PyTorch'],
    'machine learning': ['model training', 'GPU memory hierarchy', 'parallelism', 'SLURM'],
    'software development': ['compute constraints', 'workloads optimization', 'training pipeline'],
    'data': ['data versioning', 'experiment tracking', 'model versioning'],
    'system': ['SLURM clusters', 'distributed training', 'compute-bound workloads'],
    'performance': ['GPU optimising', 'memory-bound operations', 'precision trade-offs'],
    'infrastructure': ['training infrastructure', 'VAST storage', 'object storage'],
    'development': ['custom GPU kernels', 'attention mechanisms', 'autoregressive models']
  };

  const enhancedBullets = bullets.map(bullet => {
    let enhancedDescription = bullet.description;
    let enhancedCategory = bullet.categoryLabel;

    // Check if bullet is related to any job keywords and enhance accordingly
    const bulletText = `${bullet.categoryLabel} ${bullet.description}`.toLowerCase();
    
    // Add missing keywords naturally based on context
    for (const [context, enhancements] of Object.entries(keywordEnhancements)) {
      if (bulletText.includes(context)) {
        // Find relevant missing keywords that could fit this context
        const relevantMissingKeywords = allJobKeywords.filter(keyword => 
          enhancements.some(enhancement => 
            enhancement.toLowerCase().includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(enhancement.toLowerCase())
          )
        );

        // Enhance the description with 1-2 relevant keywords
        if (relevantMissingKeywords.length > 0) {
          const keywordsToAdd = relevantMissingKeywords.slice(0, 2);
          
          // Naturally integrate keywords based on context
          if (bulletText.includes('python') && keywordsToAdd.includes('GPU')) {
            enhancedDescription = enhancedDescription.replace(
              /python/gi, 
              'Python with GPU acceleration'
            );
          }
          
          if (bulletText.includes('system') && keywordsToAdd.includes('distributed training')) {
            enhancedDescription = enhancedDescription.replace(
              /system/gi,
              'distributed training system'
            );
          }
          
          if (bulletText.includes('performance') && keywordsToAdd.includes('optimising')) {
            enhancedDescription = enhancedDescription.replace(
              /performance/gi,
              'performance optimising'
            );
          }
          
          if (bulletText.includes('data') && keywordsToAdd.includes('model versioning')) {
            enhancedDescription = enhancedDescription.replace(
              /data/gi,
              'data and model versioning'
            );
          }
          
          if (bulletText.includes('infrastructure') && keywordsToAdd.includes('SLURM')) {
            enhancedDescription = enhancedDescription.replace(
              /infrastructure/gi,
              'SLURM-based infrastructure'
            );
          }
        }
      }
    }

    // Enhance category labels to include more specific technical terms
    if (enhancedCategory.toLowerCase().includes('python') && allJobKeywords.includes('PyTorch')) {
      enhancedCategory = 'Python & PyTorch Development';
    }
    
    if (enhancedCategory.toLowerCase().includes('system') && allJobKeywords.includes('distributed training')) {
      enhancedCategory = 'Distributed Training Systems';
    }
    
    if (enhancedCategory.toLowerCase().includes('performance') && allJobKeywords.includes('GPU')) {
      enhancedCategory = 'GPU Performance Optimisation';
    }

    return {
      ...bullet,
      categoryLabel: enhancedCategory,
      description: enhancedDescription,
      score: calculateBulletScore({
        ...bullet,
        categoryLabel: enhancedCategory,
        description: enhancedDescription
      }, jobAnalysis)
    };
  });

  return enhancedBullets;
}

/**
 * Enhanced summary rewriting with better keyword integration
 */
export async function enhancedRewriteSummary(
  originalSummary: string, 
  jobAnalysis: JobAnalysis,
  profile: UserProfile
): Promise<string> {
  const missingKeywords = [
    ...jobAnalysis.mustHaveKeywords,
    ...jobAnalysis.preferredKeywords,
    ...jobAnalysis.niceToHaveKeywords
  ];
  
  // Create a more sophisticated summary that naturally incorporates keywords
  const keywordGroups = {
    technical: missingKeywords.filter(k => 
      ['GPU', 'PyTorch', 'SLURM', 'distributed training', 'parallelism', 'custom GPU kernels'].includes(k)
    ),
    optimization: missingKeywords.filter(k => 
      ['optimising', 'performance', 'memory hierarchy', 'compute constraints', 'precision trade-offs'].includes(k)
    ),
    infrastructure: missingKeywords.filter(k => 
      ['training pipeline', 'experiment tracking', 'model versioning', 'VAST', 'object storage'].includes(k)
    ),
    models: missingKeywords.filter(k => 
      ['diffusion models', 'autoregressive models', 'attention mechanisms', 'model training'].includes(k)
    )
  };

  // Build enhanced summary
  let enhancedSummary = originalSummary;
  
  // Add technical expertise
  if (keywordGroups.technical.length > 0) {
    const techKeywords = keywordGroups.technical.slice(0, 3).join(', ');
    enhancedSummary += ` Specialized in ${techKeywords} with hands-on experience in high-performance computing environments.`;
  }
  
  // Add optimization focus
  if (keywordGroups.optimization.length > 0) {
    const optKeywords = keywordGroups.optimization.slice(0, 2).join(' and ');
    enhancedSummary += ` Expert in ${optKeywords} for large-scale machine learning workloads.`;
  }
  
  // Add infrastructure experience
  if (keywordGroups.infrastructure.length > 0) {
    const infraKeywords = keywordGroups.infrastructure.slice(0, 2).join(' and ');
    enhancedSummary += ` Proven track record in ${infraKeywords} for production ML systems.`;
  }

  return enhancedSummary;
}

/**
 * Reorder skill categories by relevance to job requirements
 * Categories with more matching keywords appear first
 */
export function reorderSkillsByRelevance(skills: SkillCategory[], jobAnalysis: JobAnalysis): SkillCategory[] {
  const allJobKeywords = [
    ...jobAnalysis.mustHaveKeywords,
    ...jobAnalysis.preferredKeywords,
    ...jobAnalysis.niceToHaveKeywords
  ].map(k => k.toLowerCase());
  
  // Calculate relevance score for each skill category
  const scoredSkills = skills.map(category => {
    let relevanceScore = 0;
    
    // Check category name
    const categoryText = category.name.toLowerCase();
    for (const keyword of allJobKeywords) {
      if (categoryText.includes(keyword)) {
        relevanceScore += 5;
      }
    }
    
    // Check individual skills
    for (const skill of category.skills) {
      const skillText = `${skill.name} ${skill.description}`.toLowerCase();
      for (const keyword of allJobKeywords) {
        if (skillText.includes(keyword)) {
          relevanceScore += 3;
        }
      }
      
      // Check skill keywords
      for (const skillKeyword of skill.keywords) {
        for (const jobKeyword of allJobKeywords) {
          if (skillKeyword.toLowerCase().includes(jobKeyword) || 
              jobKeyword.includes(skillKeyword.toLowerCase())) {
            relevanceScore += 2;
          }
        }
      }
    }
    
    return {
      ...category,
      relevanceScore
    };
  });
  
  // Sort by relevance score (highest first)
  return scoredSkills.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
}

/**
 * Calculate overall match score between profile and job requirements
 * Returns percentage of keywords that are matched in the profile
 */
export function calculateMatchScore(profile: UserProfile, jobAnalysis: JobAnalysis): number {
  const allJobKeywords = [
    ...jobAnalysis.mustHaveKeywords,
    ...jobAnalysis.preferredKeywords,
    ...jobAnalysis.niceToHaveKeywords
  ];
  
  if (allJobKeywords.length === 0) return 0;
  
  // Combine all profile text for keyword matching
  const profileText = [
    profile.summary,
    profile.experience.map(exp => 
      `${exp.jobTitle} ${exp.subtitle || ''} ${exp.company} ${exp.bullets.map(b => `${b.categoryLabel} ${b.description}`).join(' ')}`
    ).join(' '),
    profile.skills.map(cat => 
      `${cat.name} ${cat.skills.map(s => `${s.name} ${s.description} ${s.keywords.join(' ')}`).join(' ')}`
    ).join(' '),
    profile.education.map(edu => `${edu.degree} ${edu.field} ${edu.details || ''}`).join(' ')
  ].join(' ').toLowerCase();
  
  // Count matched keywords
  let matchedCount = 0;
  for (const keyword of allJobKeywords) {
    if (profileText.includes(keyword.toLowerCase())) {
      matchedCount++;
    }
  }
  
  return Math.round((matchedCount / allJobKeywords.length) * 100);
}

/**
 * Main function to create tailored content for document generation
 * Uses semantic similarity and enhanced keyword matching for better results
 */
export async function createTailoredContent(
  profile: UserProfile, 
  jobAnalysis: JobAnalysis
): Promise<TailoredContent> {
  // Use enhanced CV tailoring with semantic similarity
  const tailoredProfile = await enhancedTailorCVContent(profile, jobAnalysis);
  
  // Use enhanced summary rewriting with better keyword integration
  const enhancedSummary = await enhancedRewriteSummary(profile.summary, jobAnalysis, profile);
  
  // Reorder skills by relevance
  const reorderedSkills = reorderSkillsByRelevance(profile.skills, jobAnalysis);
  
  // Get top bullets from all experiences
  const topBullets = tailoredProfile.experience
    .flatMap(exp => exp.bullets)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 20); // Top 20 bullets across all experiences
  
  // Calculate semantic match score with enhanced profile
  const enhancedProfile = {
    ...profile,
    summary: enhancedSummary,
    experience: tailoredProfile.experience
  };
  
  // Calculate smart match score (primary) - DISABLE semantic for now to prevent issues
  let matchScore: number;
  try {
    // Use only smart matching for now to ensure 2-page limit
    matchScore = calculateSmartMatchScore(enhancedProfile, jobAnalysis);
    
    // TEMPORARILY DISABLED: semantic matching to prevent content expansion
    // // Try semantic matching first if API is available
    // matchScore = await calculateSemanticMatchScore(enhancedProfile, jobAnalysis);
    // 
    // // If semantic matching returns 0 or very low score, use smart matching
    // if (matchScore < 10) {
    //   matchScore = calculateSmartMatchScore(enhancedProfile, jobAnalysis);
    // }
  } catch (error) {
    // Fallback to smart matching if semantic fails
    matchScore = calculateSmartMatchScore(enhancedProfile, jobAnalysis);
  }
  
  return {
    summary: enhancedSummary,
    topBullets,
    reorderedSkills,
    matchScore
  };
}