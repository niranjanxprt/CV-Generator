'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfile, CVParsingResult } from '@/types';
import { processCVUpload } from '@/lib/cv-import-client';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

interface CVImportComponentProps {
  onImportComplete: (profile: Partial<UserProfile>) => void;
}

interface UploadState {
  isUploading: boolean;
  isParsing: boolean;
  progress: number;
  error: string | null;
  result: CVParsingResult | null;
  showModal: boolean;
}

export function CVImportComponent({ onImportComplete }: CVImportComponentProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    isParsing: false,
    progress: 0,
    error: null,
    result: null,
    showModal: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadState({
        isUploading: true,
        isParsing: false,
        progress: 0,
        error: null,
        result: null,
        showModal: true
      });

      // Simulate upload progress
      setUploadState(prev => ({ ...prev, progress: 25 }));
      
      // Process the CV file
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        isParsing: true, 
        progress: 50 
      }));

      const result = await processCVUpload(file);

      setUploadState(prev => ({
        ...prev,
        isParsing: false,
        progress: 100,
        result
      }));

      if (result.success) {
        // Auto-close modal after 2 seconds if successful
        setTimeout(() => {
          handleAcceptImport();
        }, 2000);
      }

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        isParsing: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        result: null
      }));
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAcceptImport = () => {
    if (uploadState.result?.success) {
      onImportComplete(uploadState.result.parsedProfile);
      closeModal();
    }
  };

  const closeModal = () => {
    setUploadState({
      isUploading: false,
      isParsing: false,
      progress: 0,
      error: null,
      result: null,
      showModal: false
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <Button onClick={handleFileSelect} variant="outline">
        <Upload className="h-4 w-4 mr-2" />
        Import from CV
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Import Modal */}
      {uploadState.showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  CV Import
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeModal}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Indicator */}
              {(uploadState.isUploading || uploadState.isParsing) && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {uploadState.isUploading ? 'Uploading file...' : 'Parsing CV with AI...'}
                    </span>
                    <span>{uploadState.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadState.progress}%` }}
                    />
                  </div>
                  {uploadState.isParsing && (
                    <p className="text-sm text-gray-600">
                      This may take a few seconds while we extract and structure your profile data...
                    </p>
                  )}
                </div>
              )}

              {/* Error State */}
              {uploadState.error && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Import Failed</h4>
                    <p className="text-sm text-red-700 mt-1">{uploadState.error}</p>
                    <Button
                      onClick={closeModal}
                      variant="outline"
                      size="sm"
                      className="mt-3"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {/* Success State */}
              {uploadState.result?.success && (
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-green-800">
                        CV Parsed Successfully!
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        Confidence: {uploadState.result.confidence}%
                      </p>
                    </div>
                  </div>

                  {/* Parsing Results Summary */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Extracted Information:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {uploadState.result.parsedProfile.header?.name && (
                        <div>✓ Name: {uploadState.result.parsedProfile.header.name}</div>
                      )}
                      {uploadState.result.parsedProfile.header?.email && (
                        <div>✓ Email: {uploadState.result.parsedProfile.header.email}</div>
                      )}
                      {uploadState.result.parsedProfile.experience && uploadState.result.parsedProfile.experience.length > 0 && (
                        <div>✓ Experience: {uploadState.result.parsedProfile.experience.length} positions</div>
                      )}
                      {uploadState.result.parsedProfile.education && uploadState.result.parsedProfile.education.length > 0 && (
                        <div>✓ Education: {uploadState.result.parsedProfile.education.length} entries</div>
                      )}
                      {uploadState.result.parsedProfile.skills && uploadState.result.parsedProfile.skills.length > 0 && (
                        <div>✓ Skills: {uploadState.result.parsedProfile.skills.length} categories</div>
                      )}
                    </div>
                  </div>

                  {/* Warnings */}
                  {uploadState.result.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-amber-800">Please Review:</h4>
                      <ul className="text-sm text-amber-700 space-y-1">
                        {uploadState.result.warnings.map((warning, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-2">⚠</span>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button onClick={handleAcceptImport} className="flex-1">
                      Accept & Import
                    </Button>
                    <Button onClick={closeModal} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Failed Parsing State */}
              {uploadState.result && !uploadState.result.success && (
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Parsing Failed</h4>
                      <div className="text-sm text-red-700 mt-1 space-y-1">
                        {uploadState.result.errors.map((error, idx) => (
                          <div key={idx}>• {error}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {uploadState.result.extractedText && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Extracted Text Preview:</h4>
                      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                        {uploadState.result.extractedText.substring(0, 500)}
                        {uploadState.result.extractedText.length > 500 && '...'}
                      </div>
                      <p className="text-xs text-gray-500">
                        Text extracted successfully, but AI parsing failed. You can manually enter your information.
                      </p>
                    </div>
                  )}

                  <Button onClick={closeModal} variant="outline" className="w-full">
                    Close & Enter Manually
                  </Button>
                </div>
              )}

              {/* File Requirements */}
              {!uploadState.isUploading && !uploadState.isParsing && !uploadState.result && !uploadState.error && (
                <div className="text-sm text-gray-600 space-y-2">
                  <h4 className="font-medium">Supported file types:</h4>
                  <ul className="space-y-1">
                    <li>• PDF files (.pdf)</li>
                    <li>• Word documents (.docx)</li>
                    <li>• Maximum file size: 10MB</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-3">
                    Your CV will be processed with AI to extract profile information. 
                    All processing happens securely and your data stays private.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}