'use client';

import { useState, useEffect } from 'react';
import { JobAnalysis, UserProfile, KeywordScore } from '@/types';
import { loadProfileFromLocalStorage } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface KeywordMatchDisplayProps {
  jobAnalysis: JobAnalysis;
}

export function KeywordMatchDisplay({ jobAnalysis }: KeywordMatchDisplayProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [keywordScores, setKeywordScores] = useState<KeywordScore[]>([]);
  const [matchPercentage, setMatchPercentage] = useState(0);

  useEffect(() => {
    const loadedProfile = loadProfileFromLocalStorage();
    if (loadedProfile) {
      setProfile(loadedProfile);
      analyzeKeywordMatches(loadedProfile, jobAnalysis);
    }
  }, [jobAnalysis]);

  const analyzeKeywordMatches = (userProfile: UserProfile, analysis: JobAnalysis) => {
    const allKeywords = [
      ...analysis.mustHaveKeywords.map(kw => ({ keyword: kw, type: 'mustHave' as const })),
      ...analysis.preferredKeywords.map(kw => ({ keyword: kw, type: 'preferred' as const })),
      ...analysis.niceToHaveKeywords.map(kw => ({ keyword: kw, type: 'niceToHave' as const }))
    ];

    // Create searchable text from profile
    const profileText = [
      userProfile.summary,
      ...userProfile.experience.flatMap(exp => [
        exp.jobTitle,
        exp.company,
        ...exp.bullets.map(bullet => bullet.description)
      ]),
      ...userProfile.education.map(edu => `${edu.degree} ${edu.field} ${edu.institution}`),
      ...userProfile.skills.flatMap(skillCat => [
        skillCat.name,
        ...skillCat.skills.map(skill => `${skill.name} ${skill.description}`)
      ]),
      ...userProfile.languages.map(lang => `${lang.name} ${lang.proficiency}`)
    ].join(' ').toLowerCase();

    const scores: KeywordScore[] = allKeywords.map(({ keyword, type }) => ({
      keyword,
      type,
      matched: profileText.includes(keyword.toLowerCase())
    }));

    setKeywordScores(scores);

    // Calculate match percentage
    const totalKeywords = scores.length;
    const matchedKeywords = scores.filter(score => score.matched).length;
    const percentage = totalKeywords > 0 ? Math.round((matchedKeywords / totalKeywords) * 100) : 0;
    setMatchPercentage(percentage);
  };

  const getMatchIcon = (matched: boolean) => {
    return matched ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getTypeColor = (type: KeywordScore['type']) => {
    switch (type) {
      case 'mustHave': return 'bg-red-100 text-red-800';
      case 'preferred': return 'bg-amber-100 text-amber-800';
      case 'niceToHave': return 'bg-green-100 text-green-800';
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  if (!profile) {
    return null;
  }

  const matchedKeywords = keywordScores.filter(score => score.matched);
  const missingKeywords = keywordScores.filter(score => !score.matched);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Keyword Match Analysis</span>
          <div className="flex items-center space-x-2">
            <span className={`text-2xl font-bold ${getMatchColor(matchPercentage)}`}>
              {matchPercentage}%
            </span>
            <span className="text-sm text-gray-500">match</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Match Summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{matchedKeywords.length}</div>
            <div className="text-sm text-gray-500">Matched</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{missingKeywords.length}</div>
            <div className="text-sm text-gray-500">Missing</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">{keywordScores.length}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
        </div>

        {/* Matched Keywords */}
        {matchedKeywords.length > 0 && (
          <div>
            <h4 className="font-semibold text-green-700 mb-3 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Matched Keywords ({matchedKeywords.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {matchedKeywords.map((score, index) => (
                <div key={index} className="flex items-center space-x-1">
                  {getMatchIcon(score.matched)}
                  <Badge variant="outline" className={getTypeColor(score.type)}>
                    {score.keyword}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Keywords */}
        {missingKeywords.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-700 mb-3 flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              Missing Keywords ({missingKeywords.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {missingKeywords.map((score, index) => (
                <div key={index} className="flex items-center space-x-1">
                  {getMatchIcon(score.matched)}
                  <Badge variant="outline" className={getTypeColor(score.type)}>
                    {score.keyword}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Recommendation:</p>
                  <p>Consider updating your profile to include these missing keywords where relevant to improve your match score.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Match Quality Indicator */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Match Quality</span>
            <span className={`text-sm font-medium ${getMatchColor(matchPercentage)}`}>
              {matchPercentage >= 80 ? 'Excellent' : 
               matchPercentage >= 60 ? 'Good' : 
               matchPercentage >= 40 ? 'Fair' : 'Needs Improvement'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                matchPercentage >= 80 ? 'bg-green-600' :
                matchPercentage >= 60 ? 'bg-amber-600' :
                'bg-red-600'
              }`}
              style={{ width: `${matchPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}