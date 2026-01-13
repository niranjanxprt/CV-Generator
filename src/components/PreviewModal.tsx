'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GeneratedDocument } from '@/types';
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { PDFViewer } from './PDFViewer';
import { PDFErrorBoundary } from './PDFErrorBoundary';

interface PreviewModalProps {
  document: GeneratedDocument;
  onClose: () => void;
  onDownload: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  document,
  onClose,
  onDownload
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(0.8); // Start with better default zoom

  useEffect(() => {
    // Create object URL for PDF blob
    const url = URL.createObjectURL(document.pdfBlob);
    setPdfUrl(url);

    // Cleanup on unmount
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [document.pdfBlob]);

  useEffect(() => {
    // Keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
          }
          break;
        case 'ArrowRight':
          if (currentPage < document.pageCount) {
            setCurrentPage(prev => prev + 1);
          }
          break;
        case '+':
        case '=':
          setZoom(prev => Math.min(prev + 0.2, 2));
          break;
        case '-':
          setZoom(prev => Math.max(prev - 0.2, 0.4));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, document.pageCount, onClose]);

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentPage < document.pageCount) {
        setCurrentPage(prev => prev + 1);
      }
    },
    onSwipedRight: () => {
      if (currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    },
    trackMouse: true
  });

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.4));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{document.name}</h2>
            <p className="text-sm text-gray-600">
              Page {currentPage} of {document.pageCount}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.4}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2 min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 2}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            {/* Page Navigation */}
            {document.pageCount > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= document.pageCount}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {/* Download Button */}
            <Button onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            
            {/* Close Button */}
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div 
          className="flex-1 overflow-auto p-6 bg-gray-50"
          {...swipeHandlers}
        >
          <div className="flex justify-center">
            {pdfUrl && (
              <PDFErrorBoundary onRetry={() => window.location.reload()}>
                <PDFViewer
                  pdfUrl={pdfUrl}
                  title={`${document.name} - Page ${currentPage}`}
                  zoom={zoom}
                  currentPage={currentPage}
                  onDownload={onDownload}
                />
              </PDFErrorBoundary>
            )}
          </div>
        </div>

        {/* Footer with instructions */}
        <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
          <div className="flex flex-wrap gap-4 justify-center">
            <span>Press ESC to close</span>
            {document.pageCount > 1 && (
              <span>Use arrow keys or swipe to navigate pages</span>
            )}
            <span>Use +/- keys to zoom</span>
          </div>
        </div>
      </div>
    </div>
  );
};