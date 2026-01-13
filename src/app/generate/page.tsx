'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { JobAnalysis, DocumentType } from '@/types';
import { analyzeJobWithCaching } from '@/lib/perplexity';
import { loadProfileFromLocalStorage } from '@/lib/storage';
import { KeywordMatchDisplay } from '@/components/KeywordMatchDisplay';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function GeneratePage() {
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<DocumentType>>(new Set());
  const [hasProfile, setHasProfile] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasEnvApiKey, setHasEnvApiKey] = useState(false);

  useEffect(() => {
    // Check if user has a profile
    const profile = loadProfileFromLocalStorage();
    setHasProfile(!!profile);
    
    // Check if environment API key exists
    const envKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
    setHasEnvApiKey(!!envKey && envKey !== 'your_perplexity_api_key_here');
  }, []);

  const handleAnalyzeJob = async () => {
    if (jobDescription.trim().length < 50) {
      setError('Job description must be at least 50 characters long');
      return;
    }

    // Check if we have an API key (either from environment or user input)
    if (!hasEnvApiKey && !apiKey.trim()) {
      setError('Please provide your Perplexity API key to analyze the job description');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysis = await analyzeJobWithCaching(jobDescription, apiKey);
      setJobAnalysis(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze job description');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDocumentSelection = (documentType: DocumentType, checked: boolean) => {
    const newSelection = new Set(selectedDocuments);
    if (checked) {
      newSelection.add(documentType);
    } else {
      newSelection.delete(documentType);
    }
    setSelectedDocuments(newSelection);
  };

  const handleGenerate = () => {
    if (selectedDocuments.size === 0) return;
    
    // Navigate to results page with selected documents and job analysis
    const params = new URLSearchParams({
      documents: Array.from(selectedDocuments).join(','),
      jobAnalysis: JSON.stringify(jobAnalysis)
    });
    
    window.location.href = `/results?${params.toString()}`;
  };

  const getKeywordBadgeColor = (type: 'mustHave' | 'preferred' | 'niceToHave') => {
    switch (type) {
      case 'mustHave': return 'bg-red-100 text-red-800 border-red-200';
      case 'preferred': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'niceToHave': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  if (!hasProfile) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
              Profile Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You need to create a professional profile before generating documents.
            </p>
            <Link href="/profile">
              <Button>Create Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Documents</h1>
        <p className="text-gray-600">
          Paste a job description to analyze requirements and generate tailored documents
        </p>
      </div>

      {/* API Key Input - Show only if no environment key */}
      {!hasEnvApiKey && (
        <ApiKeyInput 
          onApiKeyChange={setApiKey}
          initialApiKey={apiKey}
        />
      )}

      {/* Job Description Input */}
      <Card>
        <CardHeader>
          <CardTitle>Job Description Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="jobDescription">Job Description *</Label>
            <Textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the complete job description here..."
              rows={8}
              className="mt-1"
            />
            <div className="flex justify-between mt-1">
              <div className="text-sm text-gray-500">
                {jobDescription.length}/10,000 characters
                {jobDescription.length < 50 && (
                  <span className="text-red-600 ml-2">
                    (Minimum 50 characters required)
                  </span>
                )}
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
          </div>

          <Button 
            onClick={handleAnalyzeJob}
            disabled={isAnalyzing || jobDescription.trim().length < 50 || (!hasEnvApiKey && !apiKey.trim())}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing job requirements...
              </>
            ) : (
              'Analyze Job'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {jobAnalysis && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Analysis Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Job Title</Label>
                  <p className="text-lg font-semibold">{jobAnalysis.jobTitle}</p>
                </div>
                {jobAnalysis.companyName && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Company</Label>
                    <p className="text-lg font-semibold">{jobAnalysis.companyName}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Language Requirement</Label>
                  <p className="text-lg font-semibold">{jobAnalysis.languageRequirement}</p>
                </div>
              </div>

              {/* Keywords Display */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Extracted Keywords</h3>
                
                {jobAnalysis.mustHaveKeywords.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-red-700 mb-2 block">
                      Must-Have Keywords ({jobAnalysis.mustHaveKeywords.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {jobAnalysis.mustHaveKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-sm border ${getKeywordBadgeColor('mustHave')}`}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {jobAnalysis.preferredKeywords.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-amber-700 mb-2 block">
                      Preferred Keywords ({jobAnalysis.preferredKeywords.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {jobAnalysis.preferredKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-sm border ${getKeywordBadgeColor('preferred')}`}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {jobAnalysis.niceToHaveKeywords.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-green-700 mb-2 block">
                      Nice-to-Have Keywords ({jobAnalysis.niceToHaveKeywords.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {jobAnalysis.niceToHaveKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-sm border ${getKeywordBadgeColor('niceToHave')}`}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <KeywordMatchDisplay jobAnalysis={jobAnalysis} />
            </CardContent>
          </Card>

          {/* Document Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Documents to Generate</CardTitle>
              <p className="text-sm text-gray-600">
                Choose which documents you want to create. Only selected documents will be generated.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">German Documents</h3>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="germanCV"
                      checked={selectedDocuments.has('germanCV')}
                      onCheckedChange={(checked) => handleDocumentSelection('germanCV', checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="germanCV"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        German CV (Lebenslauf)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Professional German CV format, maximum 2 pages
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="germanCoverLetter"
                      checked={selectedDocuments.has('germanCoverLetter')}
                      onCheckedChange={(checked) => handleDocumentSelection('germanCoverLetter', checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="germanCoverLetter"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        German Cover Letter (Anschreiben)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Formal German business letter format, 1 page
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">English Documents</h3>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="englishCV"
                      checked={selectedDocuments.has('englishCV')}
                      onCheckedChange={(checked) => handleDocumentSelection('englishCV', checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="englishCV"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        English CV (Resume)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        International English CV format, maximum 2 pages
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="englishCoverLetter"
                      checked={selectedDocuments.has('englishCoverLetter')}
                      onCheckedChange={(checked) => handleDocumentSelection('englishCoverLetter', checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="englishCoverLetter"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        English Cover Letter
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Professional English cover letter, 1 page
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={handleGenerate}
                  disabled={selectedDocuments.size === 0}
                  className="w-full"
                  size="lg"
                >
                  Generate Selected Documents ({selectedDocuments.size})
                </Button>
                {selectedDocuments.size === 0 && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Select at least one document to generate
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}