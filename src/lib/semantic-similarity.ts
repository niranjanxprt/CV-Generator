import { UserProfile, JobAnalysis, CategorizedBullet } from '@/types';

/**
 * Hugging Face Inference API for embeddings
 * Using sentence-transformers/all-MiniLM-L6-v2 for semantic similarity
 */
const HF_API_URL = 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2';
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;

interface EmbeddingResponse {
  embeddings?: number[][];
  error?: string;
}

/**
 * Get embeddings from Hugging Face API
 */
async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (!HF_API_KEY) {
    console.warn('Hugging Face API key not found, falling back to simple matching');
    return [];
  }

  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: texts,
        options: { wait_for_model: true }
      }),
    });

    if (!response.ok) {
      throw new Error(`HF API error: ${response.status}`);
    }

    const embeddings = await response.json();
    
    // Handle different response formats
    if (Array.isArray(embeddings) && Array.isArray(embeddings[0])) {
      return embeddings as number[][];
    }
    
    return [];
  } catch (error) {
    console.warn('Failed to get embeddings from Hugging Face:', error);
    return [];
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Enhanced bullet scoring using semantic similarity
 */
export async function calculateSemanticBulletScore(
  bullet: CategorizedBullet, 
  jobAnalysis: JobAnalysis
): Promise<number> {
  const bulletText = `${bullet.categoryLabel} ${bullet.description}`;
  const allJobKeywords = [
    ...jobAnalysis.mustHaveKeywords,
    ...jobAnalysis.preferredKeywords,
    ...jobAnalysis.niceToHaveKeywords
  ];

  // Fallback to simple string matching if no API key
  if (!HF_API_KEY) {
    return calculateSimpleScore(bullet, jobAnalysis);
  }

  try {
    // Get embeddings for bullet text and job keywords
    const texts = [bulletText, ...allJobKeywords];
    const embeddings = await getEmbeddings(texts);
    
    if (embeddings.length === 0) {
      return calculateSimpleScore(bullet, jobAnalysis);
    }

    const bulletEmbedding = embeddings[0];
    let totalScore = 0;

    // Calculate semantic similarity with each keyword
    for (let i = 1; i < embeddings.length; i++) {
      const keywordEmbedding = embeddings[i];
      const similarity = cosineSimilarity(bulletEmbedding, keywordEmbedding);
      
      // Convert similarity to score based on keyword importance
      const keywordIndex = i - 1;
      if (keywordIndex < jobAnalysis.mustHaveKeywords.length) {
        // Must-have keywords: high threshold (0.7) for full points
        totalScore += similarity > 0.7 ? 10 : similarity > 0.5 ? 5 : 0;
      } else if (keywordIndex < jobAnalysis.mustHaveKeywords.length + jobAnalysis.preferredKeywords.length) {
        // Preferred keywords: medium threshold (0.6)
        totalScore += similarity > 0.6 ? 5 : similarity > 0.4 ? 3 : 0;
      } else {
        // Nice-to-have keywords: lower threshold (0.5)
        totalScore += similarity > 0.5 ? 2 : similarity > 0.3 ? 1 : 0;
      }
    }

    return totalScore;
  } catch (error) {
    console.warn('Semantic scoring failed, using simple matching:', error);
    return calculateSimpleScore(bullet, jobAnalysis);
  }
}

/**
 * Simple string-based scoring as fallback
 */
function calculateSimpleScore(bullet: CategorizedBullet, jobAnalysis: JobAnalysis): number {
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
 * Find semantically similar keywords for enhancement
 */
export async function findSimilarKeywords(
  text: string, 
  keywords: string[], 
  threshold: number = 0.6
): Promise<Array<{ keyword: string; similarity: number }>> {
  if (!HF_API_KEY || keywords.length === 0) {
    return [];
  }

  try {
    const texts = [text, ...keywords];
    const embeddings = await getEmbeddings(texts);
    
    if (embeddings.length === 0) {
      return [];
    }

    const textEmbedding = embeddings[0];
    const similarities: Array<{ keyword: string; similarity: number }> = [];

    for (let i = 1; i < embeddings.length; i++) {
      const keywordEmbedding = embeddings[i];
      const similarity = cosineSimilarity(textEmbedding, keywordEmbedding);
      
      if (similarity >= threshold) {
        similarities.push({
          keyword: keywords[i - 1],
          similarity
        });
      }
    }

    // Sort by similarity (highest first)
    return similarities.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.warn('Failed to find similar keywords:', error);
    return [];
  }
}

/**
 * Enhanced keyword suggestion using semantic similarity
 */
export async function suggestKeywordEnhancements(
  bulletText: string,
  jobAnalysis: JobAnalysis
): Promise<string[]> {
  const allKeywords = [
    ...jobAnalysis.mustHaveKeywords,
    ...jobAnalysis.preferredKeywords,
    ...jobAnalysis.niceToHaveKeywords
  ];

  const similarKeywords = await findSimilarKeywords(bulletText, allKeywords, 0.5);
  
  // Return top 3 most similar keywords that aren't already in the text
  return similarKeywords
    .filter(({ keyword }) => !bulletText.toLowerCase().includes(keyword.toLowerCase()))
    .slice(0, 3)
    .map(({ keyword }) => keyword);
}

/**
 * Calculate overall semantic match score between profile and job
 */
export async function calculateSemanticMatchScore(
  profile: UserProfile, 
  jobAnalysis: JobAnalysis
): Promise<number> {
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
      cat.skills.map(skill => `${skill.name} ${skill.description}`)
    )
  ];

  if (!HF_API_KEY) {
    // Fallback to simple string matching
    let matchedCount = 0;
    const combinedProfileText = profileTexts.join(' ').toLowerCase();
    
    for (const keyword of allJobKeywords) {
      if (combinedProfileText.includes(keyword.toLowerCase())) {
        matchedCount++;
      }
    }
    
    return Math.round((matchedCount / allJobKeywords.length) * 100);
  }

  try {
    // Get embeddings for all profile texts and job keywords
    const allTexts = [...profileTexts, ...allJobKeywords];
    const embeddings = await getEmbeddings(allTexts);
    
    if (embeddings.length === 0) {
      return 0;
    }

    const profileEmbeddings = embeddings.slice(0, profileTexts.length);
    const keywordEmbeddings = embeddings.slice(profileTexts.length);
    
    let totalMatches = 0;
    
    // For each job keyword, find the best matching profile text
    for (let i = 0; i < keywordEmbeddings.length; i++) {
      const keywordEmbedding = keywordEmbeddings[i];
      let bestSimilarity = 0;
      
      for (const profileEmbedding of profileEmbeddings) {
        const similarity = cosineSimilarity(profileEmbedding, keywordEmbedding);
        bestSimilarity = Math.max(bestSimilarity, similarity);
      }
      
      // Consider it a match if similarity > 0.6
      if (bestSimilarity > 0.6) {
        totalMatches++;
      }
    }
    
    return Math.round((totalMatches / allJobKeywords.length) * 100);
  } catch (error) {
    console.warn('Semantic match calculation failed:', error);
    return 0;
  }
}