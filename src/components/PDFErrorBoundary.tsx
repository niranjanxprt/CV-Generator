'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface PDFErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface PDFErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

export class PDFErrorBoundary extends React.Component<PDFErrorBoundaryProps, PDFErrorBoundaryState> {
  constructor(props: PDFErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PDFErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PDF Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-96 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="text-center p-8">
            <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">PDF Generation Error</h3>
            <p className="text-red-700 mb-6">
              There was an error generating or displaying the PDF. This might be due to:
            </p>
            <ul className="text-sm text-red-600 mb-6 text-left max-w-md">
              <li>• Browser compatibility issues</li>
              <li>• Network connectivity problems</li>
              <li>• PDF rendering errors</li>
            </ul>
            <div className="space-x-4">
              {this.props.onRetry && (
                <Button 
                  onClick={() => {
                    this.setState({ hasError: false });
                    this.props.onRetry?.();
                  }}
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}