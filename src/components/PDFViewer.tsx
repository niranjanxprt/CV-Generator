'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  zoom: number;
  currentPage: number;
  onDownload: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  title,
  zoom,
  currentPage,
  onDownload
}) => {
  const [viewerType, setViewerType] = useState<'object' | 'iframe' | 'fallback'>('object');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Detect browser capabilities
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = userAgent.includes('chrome');
    const isFirefox = userAgent.includes('firefox');
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    
    if (isChrome || isFirefox) {
      setViewerType('object');
    } else if (isSafari) {
      setViewerType('iframe');
    } else {
      setViewerType('fallback');
    }
    
    setIsLoading(false);
  }, []);

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (viewerType === 'fallback') {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center p-8">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Preview Not Available</h3>
          <p className="text-gray-600 mb-6">Your browser doesn't support inline PDF viewing.</p>
          <div className="space-x-4">
            <Button onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={handleOpenInNewTab}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const pdfParams = `#page=${currentPage}&zoom=${Math.round(zoom * 100)}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
  const pdfSrc = `${pdfUrl}${pdfParams}`;

  return (
    <div className="bg-white shadow-2xl border border-gray-200 rounded-lg overflow-hidden">
      {viewerType === 'object' ? (
        <object
          data={pdfSrc}
          type="application/pdf"
          style={{
            width: `${595 * zoom}px`,
            height: `${842 * zoom}px`,
            minHeight: '600px',
            border: 'none'
          }}
          title={title}
        >
          <div className="flex items-center justify-center h-96 bg-gray-100">
            <div className="text-center p-8">
              <p className="text-gray-600 mb-4">PDF could not be displayed.</p>
              <div className="space-x-4">
                <Button onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={handleOpenInNewTab}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </div>
        </object>
      ) : (
        <iframe
          src={pdfSrc}
          style={{
            width: `${595 * zoom}px`,
            height: `${842 * zoom}px`,
            minHeight: '600px',
            border: 'none'
          }}
          title={title}
          onError={() => setViewerType('fallback')}
        />
      )}
    </div>
  );
};