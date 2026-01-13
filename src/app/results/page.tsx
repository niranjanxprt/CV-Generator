'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JobAnalysis, DocumentType, GeneratedDocument, UserProfile } from '@/types';
import { generateSelectedDocuments } from '@/lib/pdf-generation';
import { loadProfileFromLocalStorage } from '@/lib/storage';
import { PreviewModal } from '@/components/PreviewModal';
import { downloadPDF, generateFilename, generateZipFile } from '@/lib/download';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Package
} from 'lucide-react';

function ResultsContent() {
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<GeneratedDocument | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);

  useEffect(() => {
    const generateDocuments = async () => {
      try {
        // Parse URL parameters
        const documentsParam = searchParams.get('documents');
        const jobAnalysisParam = searchParams.get('jobAnalysis');
        
        if (!documentsParam || !jobAnalysisParam) {
          setError('Missing required parameters');
          return;
        }
        
        const selectedTypes = documentsParam.split(',') as DocumentType[];
        const parsedJobAnalysis = JSON.parse(jobAnalysisParam) as JobAnalysis;
        const userProfile = loadProfileFromLocalStorage();
        
        if (!userProfile) {
          setError('No profile found. Please create a profile first.');
          return;
        }
        
        setProfile(userProfile);
        setJobAnalysis(parsedJobAnalysis);
        
        // Generate documents
        const generatedDocs = await generateSelectedDocuments(
          selectedTypes,
          userProfile,
          parsedJobAnalysis
        );
        
        setDocuments(generatedDocs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate documents');
      } finally {
        setIsGenerating(false);
      }
    };
    
    generateDocuments();
  }, [searchParams]);

  const handlePreview = (document: GeneratedDocument) => {
    setPreviewDocument(document);
  };

  const handleDownload = async (document: GeneratedDocument) => {
    if (!jobAnalysis) return;
    
    const filename = generateFilename(
      document.type,
      profile?.header.name || 'User',
      jobAnalysis.companyName || 'Company'
    );
    
    downloadPDF(document.pdfBlob, filename);
  };

  const handleDownloadAll = async () => {
    if (!jobAnalysis || !profile) return;
    
    const zipBlob = await generateZipFile(
      documents,
      profile.header.name,
      jobAnalysis.companyName || 'Company'
    );
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `CV_Documents_${profile.header.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`;
    link.click();
  };

  const getDocumentIcon = (type: DocumentType) => {
    return <FileText className="h-5 w-5" />;
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Generation Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/generate">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Generate
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generating Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Creating your tailored documents... This may take a few moments.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Generated Documents</h1>
          <p className="text-gray-600">
            Your tailored documents are ready. Preview and download them below.
          </p>
        </div>
        <Link href="/generate">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Generate
          </Button>
        </Link>
      </div>

      {/* Success Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            Generation Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Documents Generated</p>
              <p className="text-2xl font-bold">{documents.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Match Score</p>
              <p className="text-2xl font-bold">
                {Math.round(documents.reduce((sum, doc) => sum + doc.matchScore, 0) / documents.length)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pages</p>
              <p className="text-2xl font-bold">
                {documents.reduce((sum, doc) => sum + doc.pageCount, 0)}
              </p>
            </div>
          </div>
          
          {documents.length > 1 && (
            <div className="mt-4 pt-4 border-t">
              <Button onClick={handleDownloadAll} className="w-full">
                <Package className="h-4 w-4 mr-2" />
                Download All as ZIP
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document List */}
      <div className="space-y-4">
        {documents.map((document) => (
          <Card key={document.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getDocumentIcon(document.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{document.name}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600">
                        {document.pageCount} page{document.pageCount !== 1 ? 's' : ''}
                      </span>
                      <Badge className={getMatchScoreColor(document.matchScore)}>
                        {document.matchScore}% match
                      </Badge>
                    </div>
                    {document.warnings.length > 0 && (
                      <div className="mt-2">
                        {document.warnings.map((warning, index) => (
                          <p key={index} className="text-sm text-amber-600 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {warning}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePreview(document)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button onClick={() => handleDownload(document)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Modal */}
      {previewDocument && (
        <PreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
          onDownload={() => handleDownload(previewDocument)}
        />
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Loading...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Loading your results...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}