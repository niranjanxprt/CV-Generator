import { UserProfile, JobAnalysis, CategorizedBullet } from '@/types';

/**
 * Smart keyword matching using semantic relationships and synonyms
 * Works without external APIs by using predefined semantic mappings
 */

// Semantic keyword mappings for Training Infrastructure Engineer roles
const SEMANTIC_MAPPINGS: Record<string, string[]> = {
  // GPU and Computing
  'GPU': ['graphics processing unit', 'cuda', 'gpu acceleration', 'parallel computing', 'nvidia', 'gpu memory'],
  'optimising': ['optimization', 'optimizing', 'performance tuning', 'efficiency', 'improving', 'enhancing'],
  'workloads': ['tasks', 'jobs', 'processes', 'computational work', 'training jobs', 'batch processing'],
  'parallelism': ['parallel processing', 'concurrent execution', 'distributed computing', 'multi-threading'],
  'distributed training': ['multi-node training', 'cluster training', 'parallel training', 'distributed learning'],
  
  // ML Infrastructure
  'training': ['model training', 'learning', 'neural network training', 'deep learning training'],
  'model training': ['training models', 'ml training', 'neural training', 'deep learning'],
  'experiment tracking': ['mlflow', 'experiment management', 'model versioning', 'run tracking'],
  'model versioning': ['model management', 'version control', 'model registry', 'artifact tracking'],
  'data versioning': ['data management', 'dataset versioning', 'data lineage', 'data tracking'],
  
  // Technical Infrastructure
  'SLURM': ['slurm scheduler', 'job scheduler', 'cluster management', 'workload manager'],
  'memory hierarchy': ['memory management', 'cache optimization', 'memory allocation', 'gpu memory'],
  'compute constraints': ['resource limitations', 'computational limits', 'hardware constraints'],
  'precision trade-offs': ['mixed precision', 'fp16', 'quantization', 'numerical precision'],
  
  // Frameworks and Tools
  'PyTorch': ['pytorch framework', 'torch', 'deep learning framework', 'neural networks'],
  'custom GPU kernels': ['cuda kernels', 'gpu programming', 'custom operations', 'kernel development'],
  'attention mechanisms': ['transformer attention', 'self-attention', 'multi-head attention'],
  'diffusion models': ['stable diffusion', 'generative models', 'image generation'],
  'autoregressive models': ['language models', 'gpt', 'transformer models', 'sequential models'],
  
  // Storage and Data
  'VAST': ['vast storage', 'high-performance storage', 'parallel file system'],
  'object storage': ['s3', 'blob storage', 'cloud storage', 'distributed storage'],
  'SLURM clusters': ['hpc clusters', 'computing clusters', 'distributed systems'],
  'data loading': ['data pipeline', 'data ingestion', 'batch loading', 'streaming data']
};

// Reverse mapping for finding related terms
const REVERSE_MAPPINGS: Record<string, string[]> = {};
Object.entries(SEMANTIC_MAPPINGS).forEach(([key, synonyms]) => {
  synonyms.forEach(synonym => {
    if (!REVERSE_MAPPINGS[synonym]) {
      REVERSE_MAPPINGS[synonym] = [];
    }
    REVERSE_MAPPINGS[synonym].push(key);
  });
});

/**
 * Find semantic matches between text and keywords
 */
export function findSemanticMatches(text: string, keywords: string[]): Array<{ keyword: string; confidence: number; matchedTerm: string }> {
  const lowerText = text.toLowerCase();
  const matches: Array<{ keyword: string; confidence: number; matchedTerm: string }> = [];
  
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    
    // Direct match (highest confidence)
    if (lowerText.includes(lowerKeyword)) {
      matches.push({ keyword, confidence: 1.0, matchedTerm: keyword });
      continue;
    }
    
    // Check semantic mappings
    const synonyms = SEMANTIC_MAPPINGS[lowerKeyword] || [];
    for (const synonym of synonyms) {
      if (lowerText.includes(synonym.toLowerCase())) {
        matches.push({ keyword, confidence: 0.8, matchedTerm: synonym });
        break;
      }
    }
    
    // Check reverse mappings (if text contains terms that map to this keyword)
    for (const [term, relatedKeywords] of Object.entries(REVERSE_MAPPINGS)) {
      if (lowerText.includes(term.toLowerCase()) && relatedKeywords.includes(lowerKeyword)) {
        matches.push({ keyword, confidence: 0.7, matchedTerm: term });
        break;
      }
    }
    
    // Partial word matching for technical terms
    const words = lowerText.split(/\s+/);
    for (const word of words) {
      if (word.includes(lowerKeyword) || lowerKeyword.includes(word)) {
        if (word.length > 3 && lowerKeyword.length > 3) { // Avoid short word false positives
          matches.push({ keyword, confidence: 0.6, matchedTerm: word });
          break;
        }
      }
    }
  }
  
  return matches;
}

/**
 * Enhanced bullet scoring using semantic matching
 */
export function calculateSmartBulletScore(bullet: CategorizedBullet, jobAnalysis: JobAnalysis): number {
  const bulletText = `${bullet.categoryLabel} ${bullet.description}`;
  let totalScore = 0;
  
  // Check must-have keywords with semantic matching
  const mustHaveMatches = findSemanticMatches(bulletText, jobAnalysis.mustHaveKeywords);
  for (const match of mustHaveMatches) {
    totalScore += Math.round(10 * match.confidence);
  }
  
  // Check preferred keywords
  const preferredMatches = findSemanticMatches(bulletText, jobAnalysis.preferredKeywords);
  for (const match of preferredMatches) {
    totalScore += Math.round(5 * match.confidence);
  }
  
  // Check nice-to-have keywords
  const niceToHaveMatches = findSemanticMatches(bulletText, jobAnalysis.niceToHaveKeywords);
  for (const match of niceToHaveMatches) {
    totalScore += Math.round(2 * match.confidence);
  }
  
  return totalScore;
}

/**
 * Suggest keyword enhancements based on semantic relationships
 */
export function suggestSmartKeywordEnhancements(bulletText: string, jobAnalysis: JobAnalysis): string[] {
  const allKeywords = [
    ...jobAnalysis.mustHaveKeywords,
    ...jobAnalysis.preferredKeywords,
    ...jobAnalysis.niceToHaveKeywords
  ];
  
  const suggestions: string[] = [];
  const lowerText = bulletText.toLowerCase();
  
  // Find keywords that have semantic relationships with existing text
  for (const keyword of allKeywords) {
    // Skip if keyword is already present
    if (lowerText.includes(keyword.toLowerCase())) continue;
    
    const synonyms = SEMANTIC_MAPPINGS[keyword.toLowerCase()] || [];
    
    // Check if any synonyms are present in the text
    for (const synonym of synonyms) {
      if (lowerText.includes(synonym.toLowerCase())) {
        suggestions.push(keyword);
        break;
      }
    }
    
    // Check reverse mappings
    for (const [term, relatedKeywords] of Object.entries(REVERSE_MAPPINGS)) {
      if (lowerText.includes(term.toLowerCase()) && relatedKeywords.includes(keyword.toLowerCase())) {
        suggestions.push(keyword);
        break;
      }
    }
  }
  
  return suggestions.slice(0, 3); // Return top 3 suggestions
}

/**
 * Calculate overall match score using semantic matching
 */
export function calculateSmartMatchScore(profile: UserProfile, jobAnalysis: JobAnalysis): number {
  const allJobKeywords = [
    ...jobAnalysis.mustHaveKeywords,
    ...jobAnalysis.preferredKeywords,
    ...jobAnalysis.niceToHaveKeywords
  ];
  
  if (allJobKeywords.length === 0) return 0;
  
  // Combine all profile text
  const profileTexts = [
    profile.summary,
    ...profile.experience.flatMap(exp => 
      exp.bullets.map(bullet => `${bullet.categoryLabel} ${bullet.description}`)
    ),
    ...profile.skills.flatMap(cat => 
      cat.skills.map(skill => `${skill.name} ${skill.description} ${skill.keywords.join(' ')}`)
    ),
    ...profile.education.map(edu => `${edu.degree} ${edu.field} ${edu.details || ''}`)
  ];
  
  const combinedText = profileTexts.join(' ');
  const matches = findSemanticMatches(combinedText, allJobKeywords);
  
  // Count unique matched keywords (avoid double counting)
  const uniqueMatches = new Set(matches.map(m => m.keyword));
  
  return Math.round((uniqueMatches.size / allJobKeywords.length) * 100);
}

/**
 * Enhanced bullet point rewriting with smart keyword integration
 */
export function enhanceBulletWithSmartKeywords(
  bullet: CategorizedBullet, 
  suggestions: string[]
): CategorizedBullet {
  let enhancedDescription = bullet.description;
  let enhancedCategory = bullet.categoryLabel;
  
  const bulletText = `${bullet.categoryLabel} ${bullet.description}`.toLowerCase();
  
  // Apply smart enhancements based on suggestions
  for (const suggestion of suggestions) {
    const lowerSuggestion = suggestion.toLowerCase();
    
    // Context-aware integration
    if (lowerSuggestion === 'gpu' && bulletText.includes('python')) {
      enhancedDescription = enhancedDescription.replace(/python/gi, 'Python with GPU acceleration');
      enhancedCategory = 'GPU-Accelerated Python Development';
    }
    
    if (lowerSuggestion === 'distributed training' && bulletText.includes('system')) {
      enhancedDescription = enhancedDescription.replace(/system/gi, 'distributed training system');
      enhancedCategory = 'Distributed Training Systems';
    }
    
    if (lowerSuggestion === 'optimising' && bulletText.includes('performance')) {
      enhancedDescription = enhancedDescription.replace(/performance/gi, 'performance optimising');
    }
    
    if (lowerSuggestion === 'pytorch' && (bulletText.includes('machine learning') || bulletText.includes('deep learning'))) {
      enhancedDescription = enhancedDescription.replace(/(machine learning|deep learning)/gi, '$1 using PyTorch');
    }
    
    if (lowerSuggestion === 'slurm' && bulletText.includes('infrastructure')) {
      enhancedDescription = enhancedDescription.replace(/infrastructure/gi, 'SLURM-based infrastructure');
      enhancedCategory = 'SLURM Training Infrastructure';
    }
    
    if (lowerSuggestion === 'experiment tracking' && bulletText.includes('data')) {
      enhancedDescription = enhancedDescription.replace(/data/gi, 'data with experiment tracking');
    }
  }
  
  return {
    ...bullet,
    categoryLabel: enhancedCategory,
    description: enhancedDescription
  };
}