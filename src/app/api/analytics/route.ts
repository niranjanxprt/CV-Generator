/**
 * ATS Analytics API Route
 * 
 * Provides access to ATS compliance metrics, performance tracking,
 * and compliance alerts for monitoring and reporting.
 * 
 * Requirements: 20.1, 20.2, 20.4 - ATS compliance metrics tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { atsAnalytics } from '@/lib/ats-analytics';

/**
 * GET /api/analytics
 * Get ATS analytics summary for specified period
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const period = searchParams.get('period') || '7d'; // Default: last 7 days
    const format = searchParams.get('format') || 'json'; // json or csv
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        // Try to parse custom date range
        const customStart = searchParams.get('startDate');
        const customEnd = searchParams.get('endDate');
        if (customStart) startDate.setTime(new Date(customStart).getTime());
        if (customEnd) endDate.setTime(new Date(customEnd).getTime());
    }
    
    // Generate summary
    const summary = atsAnalytics.generateSummary(startDate, endDate);
    
    // Get recent alerts
    const alerts = atsAnalytics.getRecentAlerts(24); // Last 24 hours
    
    // Return response based on format
    if (format === 'csv') {
      const csv = convertSummaryToCSV(summary);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="ats-analytics-${period}.csv"`
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        label: period
      },
      summary,
      alerts,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    });
    
  } catch (error) {
    console.error('Analytics retrieval error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: `Failed to retrieve analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/export
 * Export analytics data for external analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, endDate, format = 'json' } = body;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    const end = endDate ? new Date(endDate) : new Date();
    
    const exportData = atsAnalytics.exportData(start, end);
    
    if (format === 'csv') {
      const csv = convertExportToCSV(exportData);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="ats-analytics-export.csv"'
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: exportData,
      metadata: {
        exportedAt: new Date().toISOString(),
        recordCount: exportData.metrics.length
      }
    });
    
  } catch (error) {
    console.error('Analytics export error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: `Failed to export analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/cleanup
 * Clean up old analytics data
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysToKeep = parseInt(searchParams.get('daysToKeep') || '90');
    
    atsAnalytics.cleanupOldMetrics(daysToKeep);
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up analytics data older than ${daysToKeep} days`
    });
    
  } catch (error) {
    console.error('Analytics cleanup error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: `Failed to cleanup analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}

/**
 * Convert summary to CSV format
 */
function convertSummaryToCSV(summary: any): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Metric,Value');
  
  // Overall metrics
  lines.push(`Total Generations,${summary.totalGenerations}`);
  lines.push(`Success Rate,${(summary.successRate * 100).toFixed(2)}%`);
  lines.push(`Average Generation Time,${summary.averageGenerationTime}ms`);
  
  // Format distribution
  lines.push(`PDF Count,${summary.formatDistribution.pdf.count}`);
  lines.push(`PDF Percentage,${summary.formatDistribution.pdf.percentage.toFixed(2)}%`);
  lines.push(`DOCX Count,${summary.formatDistribution.docx.count}`);
  lines.push(`DOCX Percentage,${summary.formatDistribution.docx.percentage.toFixed(2)}%`);
  
  // ATS compliance
  lines.push(`Average Overall Score,${summary.complianceMetrics.averageOverallScore.toFixed(2)}`);
  lines.push(`Average Text Extraction Score,${summary.complianceMetrics.averageTextExtractionScore.toFixed(2)}`);
  lines.push(`Average Font Compliance Score,${summary.complianceMetrics.averageFontComplianceScore.toFixed(2)}`);
  
  return lines.join('\n');
}

/**
 * Convert export data to CSV format
 */
function convertExportToCSV(exportData: any): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Timestamp,Format,Language,Generation Time,File Size,Success,Overall Score,Text Extraction Score,Font Compliance Score');
  
  // Data rows
  exportData.metrics.forEach((metric: any) => {
    lines.push([
      metric.timestamp,
      metric.documentGeneration.format,
      metric.documentGeneration.language,
      metric.documentGeneration.generationTime,
      metric.documentGeneration.fileSize,
      metric.documentGeneration.success,
      metric.atsCompliance.overallScore,
      metric.atsCompliance.textExtractionScore,
      metric.atsCompliance.fontComplianceScore
    ].join(','));
  });
  
  return lines.join('\n');
}
