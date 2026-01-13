/**
 * Property-Based Tests for Keyword Extraction and Display
 * Feature: cv-cover-letter-generator, Property 5: Keyword Extraction and Display
 * Validates: Requirements 2.5, 2.6
 */

import * as fc from 'fast-check';
import { extractTopKeywords, groupBy, hashString } from '@/lib/perplexity';
import { JobAnalysis } from '@/types';

// Generator for JobAnalysis data
const jobAnalysisArbitrary = fc.record({
  jobTitle: fc.string({ minLength: 1, maxLength: 100 }),
  companyName: fc.string({ maxLength: 100 }),
  mustHaveKeywords: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
  preferredKeywords: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
  niceToHaveKeywords: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 8 }),
  languageRequirement: fc.constantFrom('German', 'English', 'Both') as fc.Arbitrary<'German' | 'English' | 'Both'>
});

describe('Keyword Extraction and Display Property Tests', () => {
  /**
   * Property 5a: Top Keywords Extraction Consistency
   * For any job analysis and count parameter, extractTopKeywords should return
   * exactly the requested number of keywords (or fewer if not enough available)
   */
  test('Property 5a: extractTopKeywords returns correct count', () => {
    fc.assert(
      fc.property(
        jobAnalysisArbitrary,
        fc.integer({ min: 1, max: 20 }),
        (jobAnalysis, count) => {
          const topKeywords = extractTopKeywords(jobAnalysis, count);
          
          // Should return array
          expect(Array.isArray(topKeywords)).toBe(true);
          
          // Should not exceed requested count
          expect(topKeywords.length).toBeLessThanOrEqual(count);
          
          // Should not exceed total available keywords
          const totalKeywords = jobAnalysis.mustHaveKeywords.length + 
                               jobAnalysis.preferredKeywords.length + 
                               jobAnalysis.niceToHaveKeywords.length;
          expect(topKeywords.length).toBeLessThanOrEqual(totalKeywords);
          
          // All returned items should be strings
          topKeywords.forEach(keyword => {
            expect(typeof keyword).toBe('string');
            expect(keyword.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 5b: Keyword Priority Ordering
   * For any job analysis, must-have keywords should appear before preferred,
   * and preferred should appear before nice-to-have in the extracted list
   */
  test('Property 5b: Keywords are ordered by priority', () => {
    fc.assert(
      fc.property(
        jobAnalysisArbitrary,
        fc.integer({ min: 5, max: 15 }),
        (jobAnalysis, count) => {
          const topKeywords = extractTopKeywords(jobAnalysis, count);
          
          // Find positions of keywords from each category
          const mustHavePositions: number[] = [];
          const preferredPositions: number[] = [];
          const niceToHavePositions: number[] = [];
          
          topKeywords.forEach((keyword, index) => {
            if (jobAnalysis.mustHaveKeywords.includes(keyword)) {
              mustHavePositions.push(index);
            } else if (jobAnalysis.preferredKeywords.includes(keyword)) {
              preferredPositions.push(index);
            } else if (jobAnalysis.niceToHaveKeywords.includes(keyword)) {
              niceToHavePositions.push(index);
            }
          });
          
          // Must-have keywords should come before preferred
          if (mustHavePositions.length > 0 && preferredPositions.length > 0) {
            const maxMustHave = Math.max(...mustHavePositions);
            const minPreferred = Math.min(...preferredPositions);
            expect(maxMustHave).toBeLessThan(minPreferred);
          }
          
          // Preferred keywords should come before nice-to-have
          if (preferredPositions.length > 0 && niceToHavePositions.length > 0) {
            const maxPreferred = Math.max(...preferredPositions);
            const minNiceToHave = Math.min(...niceToHavePositions);
            expect(maxPreferred).toBeLessThan(minNiceToHave);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 5c: Keyword Uniqueness
   * For any job analysis, extracted keywords should be unique (no duplicates)
   */
  test('Property 5c: Extracted keywords are unique', () => {
    fc.assert(
      fc.property(
        jobAnalysisArbitrary,
        fc.integer({ min: 1, max: 20 }),
        (jobAnalysis, count) => {
          const topKeywords = extractTopKeywords(jobAnalysis, count);
          
          // Check for uniqueness
          const uniqueKeywords = new Set(topKeywords);
          expect(uniqueKeywords.size).toBe(topKeywords.length);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 5d: GroupBy Function Correctness
   * For any array of objects and grouping key, groupBy should correctly
   * group items and preserve all original data
   */
  test('Property 5d: groupBy preserves data and groups correctly', () => {
    const objectArbitrary = fc.record({
      id: fc.uuid(), // Use UUID to ensure uniqueness
      category: fc.constantFrom('A', 'B', 'C'),
      value: fc.integer(),
      name: fc.string()
    });

    fc.assert(
      fc.property(
        fc.array(objectArbitrary, { minLength: 1, maxLength: 20 }),
        (objects) => {
          const grouped = groupBy(objects, 'category');
          
          // All original objects should be preserved
          const allGroupedObjects = Object.values(grouped).flat();
          expect(allGroupedObjects.length).toBe(objects.length);
          
          // Each object should be in the correct group
          Object.entries(grouped).forEach(([category, items]) => {
            items.forEach(item => {
              expect(item.category).toBe(category);
            });
          });
          
          // No object should appear in multiple groups (check by reference equality)
          const seenObjects = new Set();
          allGroupedObjects.forEach(obj => {
            expect(seenObjects.has(obj)).toBe(false);
            seenObjects.add(obj);
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 5e: Hash Function Consistency
   * For any string, hashString should always return the same hash,
   * and different strings should (usually) produce different hashes
   */
  test('Property 5e: hashString is consistent and deterministic', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 1000 }),
        (str) => {
          const hash1 = hashString(str);
          const hash2 = hashString(str);
          
          // Same input should produce same hash
          expect(hash1).toBe(hash2);
          
          // Hash should be a string
          expect(typeof hash1).toBe('string');
          expect(hash1.length).toBeGreaterThan(0);
          
          // Hash should be numeric string (integer)
          expect(/^-?\d+$/.test(hash1)).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 5f: Hash Function Distribution
   * For different strings, hashString should produce different hashes
   * (collision resistance - not perfect but should be rare)
   */
  test('Property 5f: hashString produces different hashes for different inputs', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 10 }),
        (strings) => {
          // Remove duplicates from input
          const uniqueStrings = [...new Set(strings)];
          if (uniqueStrings.length < 2) return; // Skip if not enough unique strings
          
          const hashes = uniqueStrings.map(str => hashString(str));
          const uniqueHashes = new Set(hashes);
          
          // Most hashes should be unique (allowing for some collisions)
          // We expect at least 80% uniqueness for reasonable collision resistance
          const uniquenessRatio = uniqueHashes.size / hashes.length;
          expect(uniquenessRatio).toBeGreaterThan(0.8);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 5g: Keyword Extraction Completeness
   * For any job analysis, if we request more keywords than available,
   * we should get all available keywords (after filtering empty/whitespace)
   */
  test('Property 5g: Keyword extraction returns all available when count exceeds total', () => {
    fc.assert(
      fc.property(
        jobAnalysisArbitrary,
        (jobAnalysis) => {
          // Filter out empty/whitespace keywords to match the implementation
          const validMustHave = jobAnalysis.mustHaveKeywords.filter(kw => kw && kw.trim().length > 0);
          const validPreferred = jobAnalysis.preferredKeywords.filter(kw => kw && kw.trim().length > 0);
          const validNiceToHave = jobAnalysis.niceToHaveKeywords.filter(kw => kw && kw.trim().length > 0);
          
          // Calculate total valid keywords (accounting for potential duplicates)
          const allValidKeywords = [...validMustHave, ...validPreferred, ...validNiceToHave];
          const uniqueValidKeywords = [...new Set(allValidKeywords.map(kw => kw.trim()))];
          const totalValidKeywords = uniqueValidKeywords.length;
          
          // Request more keywords than available
          const requestedCount = totalValidKeywords + 10;
          const topKeywords = extractTopKeywords(jobAnalysis, requestedCount);
          
          // Should return exactly the total available valid keywords
          expect(topKeywords.length).toBe(totalValidKeywords);
          
          // Should contain all unique valid keywords
          uniqueValidKeywords.forEach(keyword => {
            expect(topKeywords).toContain(keyword);
          });
        }
      ),
      { numRuns: 20 }
    );
  });
});