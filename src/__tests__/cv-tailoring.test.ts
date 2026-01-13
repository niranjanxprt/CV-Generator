import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { 
  calculateBulletScore, 
  tailorCVContent, 
  reorderSkillsByRelevance, 
  calculateMatchScore 
} from '@/lib/cv-tailoring';
import { UserProfile, JobAnalysis, CategorizedBullet, SkillCategory, ExperienceEntry } from '@/types';

// Arbitraries for generating test data
const keywordArb = fc.string({ minLength: 3, maxLength: 15 }).filter(s => /^[a-zA-Z0-9\s]+$/.test(s));

const bulletArb: fc.Arbitrary<CategorizedBullet> = fc.record({
  id: fc.uuid(),
  categoryLabel: keywordArb,
  description: fc.string({ minLength: 10, maxLength: 100 }),
  keywords: fc.array(keywordArb, { minLength: 0, maxLength: 5 }),
  score: fc.option(fc.integer({ min: 0, max: 50 }))
});

const experienceArb: fc.Arbitrary<ExperienceEntry> = fc.record({
  id: fc.uuid(),
  jobTitle: keywordArb,
  subtitle: fc.option(keywordArb),
  company: keywordArb,
  location: keywordArb,
  startDate: fc.constantFrom('01/2020', '06/2021', '03/2019', '12/2022'),
  endDate: fc.constantFrom('12/2023', 'Present', '05/2024', 'Heute'),
  bullets: fc.array(bulletArb, { minLength: 3, maxLength: 12 })
});

const skillArb = fc.record({
  name: keywordArb,
  description: keywordArb,
  keywords: fc.array(keywordArb, { minLength: 1, maxLength: 3 })
});

const skillCategoryArb: fc.Arbitrary<SkillCategory> = fc.record({
  id: fc.uuid(),
  name: keywordArb,
  skills: fc.array(skillArb, { minLength: 2, maxLength: 6 }),
  relevanceScore: fc.option(fc.integer({ min: 0, max: 100 }))
});

const jobAnalysisArb: fc.Arbitrary<JobAnalysis> = fc.record({
  jobTitle: keywordArb,
  companyName: keywordArb,
  mustHaveKeywords: fc.array(keywordArb, { minLength: 1, maxLength: 5 }),
  preferredKeywords: fc.array(keywordArb, { minLength: 1, maxLength: 5 }),
  niceToHaveKeywords: fc.array(keywordArb, { minLength: 1, maxLength: 5 }),
  languageRequirement: fc.constantFrom('German', 'English', 'Both')
});

const profileArb: fc.Arbitrary<UserProfile> = fc.record({
  header: fc.record({
    name: fc.string({ minLength: 5, maxLength: 30 }),
    title: keywordArb,
    location: keywordArb,
    phone: fc.constantFrom('+49 123 456789', '+1 555 123 4567'),
    email: fc.string({ minLength: 5, maxLength: 30 }).map(s => `${s}@example.com`),
    linkedin: fc.string({ minLength: 5, maxLength: 20 }).map(s => `https://linkedin.com/in/${s}`),
    github: fc.string({ minLength: 5, maxLength: 20 }).map(s => `https://github.com/${s}`)
  }),
  summary: fc.string({ minLength: 50, maxLength: 200 }),
  experience: fc.array(experienceArb, { minLength: 1, maxLength: 4 }),
  education: fc.array(fc.record({
    id: fc.uuid(),
    degree: keywordArb,
    field: keywordArb,
    institution: keywordArb,
    startDate: fc.constantFrom('09/2015', '09/2018'),
    endDate: fc.constantFrom('06/2019', '12/2022'),
    details: fc.option(keywordArb)
  }), { minLength: 1, maxLength: 3 }),
  skills: fc.array(skillCategoryArb, { minLength: 2, maxLength: 6 }),
  languages: fc.array(fc.record({
    id: fc.uuid(),
    name: fc.constantFrom('English', 'German', 'Spanish', 'French'),
    proficiency: fc.constantFrom('Native', 'Fluent', 'Intermediate', 'Basic')
  }), { minLength: 1, maxLength: 4 }),
  references: fc.array(fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 5, maxLength: 30 }),
    title: keywordArb,
    company: keywordArb,
    email: fc.string({ minLength: 5, maxLength: 20 }).map(s => `${s}@example.com`)
  }), { minLength: 0, maxLength: 3 })
});

describe('CV Tailoring Algorithm Property Tests', () => {
  describe('Property 12: CV Tailoring Algorithm Correctness', () => {
    it('bullet scoring should be deterministic and consistent', () => {
      fc.assert(fc.property(bulletArb, jobAnalysisArb, (bullet, jobAnalysis) => {
        const score1 = calculateBulletScore(bullet, jobAnalysis);
        const score2 = calculateBulletScore(bullet, jobAnalysis);
        
        // Property: Same inputs should produce same outputs
        expect(score1).toBe(score2);
        
        // Property: Score should be non-negative
        expect(score1).toBeGreaterThanOrEqual(0);
        
        // Property: Score should reflect keyword presence
        const bulletText = `${bullet.categoryLabel} ${bullet.description}`.toLowerCase();
        let expectedMinScore = 0;
        
        // Count expected minimum score based on keyword matches
        for (const keyword of jobAnalysis.mustHaveKeywords) {
          if (bulletText.includes(keyword.toLowerCase())) {
            expectedMinScore += 10;
          }
        }
        for (const keyword of jobAnalysis.preferredKeywords) {
          if (bulletText.includes(keyword.toLowerCase())) {
            expectedMinScore += 5;
          }
        }
        for (const keyword of jobAnalysis.niceToHaveKeywords) {
          if (bulletText.includes(keyword.toLowerCase())) {
            expectedMinScore += 2;
          }
        }
        
        expect(score1).toBeGreaterThanOrEqual(expectedMinScore);
      }), { numRuns: 15 });
    });

    it('CV tailoring should preserve profile structure while optimizing content', () => {
      fc.assert(fc.property(profileArb, jobAnalysisArb, (profile, jobAnalysis) => {
        const tailoredProfile = tailorCVContent(profile, jobAnalysis);
        
        // Property: Structure preservation
        expect(tailoredProfile.header).toEqual(profile.header);
        expect(tailoredProfile.summary).toBe(profile.summary);
        expect(tailoredProfile.education).toEqual(profile.education);
        expect(tailoredProfile.languages).toEqual(profile.languages);
        expect(tailoredProfile.references).toEqual(profile.references);
        
        // Skills should have the same content but may have relevanceScore added and be reordered
        expect(tailoredProfile.skills).toHaveLength(profile.skills.length);
        
        // Check that the total number of individual skills is preserved
        const originalTotalSkills = profile.skills.reduce((sum, cat) => sum + cat.skills.length, 0);
        const tailoredTotalSkills = tailoredProfile.skills.reduce((sum, cat) => sum + cat.skills.length, 0);
        expect(tailoredTotalSkills).toBe(originalTotalSkills);
        
        // Check that all skill categories have relevanceScore added
        tailoredProfile.skills.forEach(skill => {
          expect(typeof skill.relevanceScore).toBe('number');
        });
        
        // Property: Experience count preservation
        expect(tailoredProfile.experience).toHaveLength(profile.experience.length);
        
        // Property: Bullet optimization (up to 4 bullets per experience)
        tailoredProfile.experience.forEach((exp, index) => {
          const originalExp = profile.experience[index];
          
          // Should have same basic info
          expect(exp.id).toBe(originalExp.id);
          expect(exp.jobTitle).toBe(originalExp.jobTitle);
          expect(exp.company).toBe(originalExp.company);
          
          // Should have optimized bullets (max 4)
          expect(exp.bullets.length).toBeLessThanOrEqual(4);
          expect(exp.bullets.length).toBeLessThanOrEqual(originalExp.bullets.length);
          
          // All bullets should be from original set
          exp.bullets.forEach(bullet => {
            const originalBullet = originalExp.bullets.find(b => b.id === bullet.id);
            expect(originalBullet).toBeDefined();
          });
        });
      }), { numRuns: 15 });
    });

    it('skill reordering should maintain all skills while optimizing order', () => {
      fc.assert(fc.property(fc.array(skillCategoryArb, { minLength: 2, maxLength: 6 }), jobAnalysisArb, (skills, jobAnalysis) => {
        const reorderedSkills = reorderSkillsByRelevance(skills, jobAnalysis);
        
        // Property: Count preservation
        expect(reorderedSkills).toHaveLength(skills.length);
        
        // Property: Content preservation (all original skills present)
        const originalIds = skills.map(s => s.id).sort();
        const reorderedIds = reorderedSkills.map(s => s.id).sort();
        expect(reorderedIds).toEqual(originalIds);
        
        // Property: Relevance scoring (each skill should have a score)
        reorderedSkills.forEach(skill => {
          expect(typeof skill.relevanceScore).toBe('number');
          expect(skill.relevanceScore).toBeGreaterThanOrEqual(0);
        });
        
        // Property: Ordering correctness (scores should be in descending order)
        for (let i = 0; i < reorderedSkills.length - 1; i++) {
          expect(reorderedSkills[i].relevanceScore).toBeGreaterThanOrEqual(
            reorderedSkills[i + 1].relevanceScore
          );
        }
      }), { numRuns: 15 });
    });

    it('match score calculation should be consistent and bounded', () => {
      fc.assert(fc.property(profileArb, jobAnalysisArb, (profile, jobAnalysis) => {
        const matchScore = calculateMatchScore(profile, jobAnalysis);
        
        // Property: Score bounds (0-100 percentage)
        expect(matchScore).toBeGreaterThanOrEqual(0);
        expect(matchScore).toBeLessThanOrEqual(100);
        
        // Property: Deterministic calculation
        const matchScore2 = calculateMatchScore(profile, jobAnalysis);
        expect(matchScore).toBe(matchScore2);
        
        // Property: Empty keywords should result in 0 score
        const emptyJobAnalysis: JobAnalysis = {
          ...jobAnalysis,
          mustHaveKeywords: [],
          preferredKeywords: [],
          niceToHaveKeywords: []
        };
        const emptyScore = calculateMatchScore(profile, emptyJobAnalysis);
        expect(emptyScore).toBe(0);
        
        // Property: Score should reflect keyword presence
        const allKeywords = [
          ...jobAnalysis.mustHaveKeywords,
          ...jobAnalysis.preferredKeywords,
          ...jobAnalysis.niceToHaveKeywords
        ];
        
        if (allKeywords.length > 0) {
          // If we have keywords, score should be meaningful
          expect(typeof matchScore).toBe('number');
          expect(Number.isInteger(matchScore)).toBe(true);
        }
      }), { numRuns: 15 });
    });
  });
});