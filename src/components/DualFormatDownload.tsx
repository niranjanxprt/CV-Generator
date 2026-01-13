/**
 * Dual Format Download Component
 * 
 * Provides download functionality for both PDF and DOCX formats
 * with user feedback and progress indication.
 * 
 * Requirements: 18.2, 18.5 - Dual format download UI with user feedback
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserProfile, TailoredContent } from '@/types';
import { 
  Download, 
  FileText, 
  File, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Info
} from 'lucide-react';

export interface DualFormatDownloadProps {
  profile: UserProfile;
  tailoredContent: TailoredContent;
  language?: 'en' | 'de';
  className?: string;
  showFormatInfo?: boolean;
}

interface DownloadState {
  isDownloading: boolean;
  format: 'pdf' | 'docx' | null;
  error: string | null;
  success: string | null;
}

export const DualFormatDownload: React.FC<DualFormatDownloadProps> = ({
  profile,
  tailoredContent,
  language = 'en',
  className = '',
  showFormatInfo = true
}) => {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
    format: null,
    error: null,
    success: null
  });

  /**
   * Handle download for specified format
   */
  const handleDownload = async (format: 'pdf' | 'docx') => {
    setDownloadState({
      isDownloading: true,
      format,
      error: null,
      success: null
    });

    try {
      // Prepare download request
      const downloadRequest = {
        profile,
        tailoredContent,
        format,
        language,
        filename: generateFilename(profile.header.name, format, language)
      };

      // Call download API
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(downloadRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Download failed with status ${response.status}`);
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : downloadRequest.filename;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success message
      setDownloadState({
        isDownloading: false,
        format: null,
        error: null,
        success: `${format.toUpperCase()} downloaded successfully!`
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setDownloadState(prev => ({ ...prev, success: null }));
      }, 3000);

    } catch (error) {
      console.error('Download error:', error);
      setDownloadState({
        isDownloading: false,
        format: null,
        error: error instanceof Error ? error.message : 'Download failed',
        success: null
      });

      // Clear error message after 5 seconds
      setTimeout(() => {
        setDownloadState(prev => ({ ...prev, error: null }));
      }, 5000);
    }
  };

  /**
   * Generate filename for download
   */
  const generateFilename = (name: string, format: 'pdf' | 'docx', lang: string): string => {
    const sanitizedName = name.replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    return `${sanitizedName}_CV_${lang.toUpperCase()}_${timestamp}.${format}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Format Information */}
      {showFormatInfo && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 mb-2">ATS-Optimized Formats</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Both formats use standard fonts and are optimized for Applicant Tracking Systems (ATS).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">PDF Format</p>
                      <p className="text-xs text-gray-500">Universal compatibility, preserves formatting</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <File className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">DOCX Format</p>
                      <p className="text-xs text-gray-500">Editable by recruiters, native ATS format</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Download Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Download Resume</h3>
              <p className="text-sm text-gray-600">
                Choose your preferred format for maximum ATS compatibility
              </p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              ATS Optimized
            </Badge>
          </div>

          {/* Status Messages */}
          {downloadState.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                <p className="text-sm text-red-700">{downloadState.error}</p>
              </div>
            </div>
          )}

          {downloadState.success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <p className="text-sm text-green-700">{downloadState.success}</p>
              </div>
            </div>
          )}

          {/* Download Buttons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PDF Download */}
            <Button
              onClick={() => handleDownload('pdf')}
              disabled={downloadState.isDownloading}
              className="h-auto p-4 flex flex-col items-center space-y-2"
              variant={downloadState.format === 'pdf' && downloadState.isDownloading ? 'default' : 'outline'}
            >
              {downloadState.isDownloading && downloadState.format === 'pdf' ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <FileText className="h-6 w-6 text-red-500" />
              )}
              <div className="text-center">
                <p className="font-medium">Download PDF</p>
                <p className="text-xs text-gray-500">
                  {downloadState.isDownloading && downloadState.format === 'pdf' 
                    ? 'Generating...' 
                    : 'Universal compatibility'
                  }
                </p>
              </div>
            </Button>

            {/* DOCX Download */}
            <Button
              onClick={() => handleDownload('docx')}
              disabled={downloadState.isDownloading}
              className="h-auto p-4 flex flex-col items-center space-y-2"
              variant={downloadState.format === 'docx' && downloadState.isDownloading ? 'default' : 'outline'}
            >
              {downloadState.isDownloading && downloadState.format === 'docx' ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <File className="h-6 w-6 text-blue-500" />
              )}
              <div className="text-center">
                <p className="font-medium">Download DOCX</p>
                <p className="text-xs text-gray-500">
                  {downloadState.isDownloading && downloadState.format === 'docx' 
                    ? 'Generating...' 
                    : 'Editable format'
                  }
                </p>
              </div>
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Match Score: {tailoredContent.matchScore}%</span>
              <span>Language: {language.toUpperCase()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Format Comparison (Optional) */}
      {showFormatInfo && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">Format Comparison</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Feature</th>
                    <th className="text-center py-2">PDF</th>
                    <th className="text-center py-2">DOCX</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b">
                    <td className="py-2">ATS Compatibility</td>
                    <td className="text-center py-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center py-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Preserves Formatting</td>
                    <td className="text-center py-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center py-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Editable by Recruiters</td>
                    <td className="text-center py-2">
                      <span className="text-gray-400">Limited</span>
                    </td>
                    <td className="text-center py-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">Universal Compatibility</td>
                    <td className="text-center py-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center py-2">
                      <span className="text-gray-400">Good</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};