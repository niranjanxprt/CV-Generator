/**
 * ATS Compliance Analytics and Monitoring System
 * 
 * Tracks ATS compliance metrics, format adoption, and performance
 * to ensure continuous improvement of ATS compatibility.
 * 
 * Requirements: 20.1, 20.2, 20.4 - ATS compliance metrics tracking
 */

export interface ATSMetrics {
  timestamp: Date;
  sessionId: string;
  userId?: string;
  
  // Document Generation Metrics
  documentGeneration: {
    format: 'pdf' | 'docx';
    language: 'en' | 'de';
    generationTime: number; // milliseconds
    fileSize: number; // bytes
    success: boolean;
    error?: string;
  };
  
  // ATS Compliance Scores
  atsCompliance: {
    overallScore: number;
    textExtractionScore: number;
    fontComplianceScore: number;
    structureComplianceScore: number;
    keywordOptimizationScore: number;
    formatComplianceScore: number;
    criticalIssuesCount: number;
    warningIssuesCount: number;
  };
  
  // User Profile Characteristics
  profileMetrics: {
    experienceCount: number;
    skillCategoryCount: number;
    educationCount: number;
    languageCount: number;
    summaryWordCount: number;
    totalBulletPoints: number;
  };
  
  // Job Matching Metrics
  jobMatching: {
    matchScore: number;
    mustHaveKeywordsFound: number;
    preferredKeywordsFound: number;
    niceToHaveKeywordsFound: number;
    totalKeywords: number;
  };
}

export interface ATSAnalyticsSummary {
  period: {
    start: Date;
    end: Date;
  };
  
  // Overall Performance
  totalGenerations: number;
  successRate: number;
  averageGenerationTime: number;
  
  // Format Adoption
  formatDistribution: {
    pdf: { count: number; percentage: number };
    docx: { count: number; percentage: number };
  };
  
  // Language Distribution
  languageDistribution: {
    en: { count: number; percentage: number };
    de: { count: number; percentage: number };
  };
  
  // ATS Compliance Trends
  complianceMetrics: {
    averageOverallScore: number;
    averageTextExtractionScore: number;
    averageFontComplianceScore: number;
    scoreDistribution: {
      excellent: number; // 90-100
      good: number; // 70-89
      moderate: number; // 50-69
      poor: number; // 0-49
    };
  };
  
  // Issue Analysis
  issueAnalysis: {
    totalCriticalIssues: number;
    totalWarningIssues: number;
    commonIssueTypes: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };
  
  // Performance Insights
  performanceInsights: {
    fastestGeneration: number;
    slowestGeneration: number;
    averageFileSize: {
      pdf: number;
      docx: number;
    };
  };
}

export interface ComplianceAlert {
  id: string;
  timestamp: Date;
  severity: 'critical' | 'warning' | 'info';
  type: 'score_degradation' | 'high_error_rate' | 'performance_issue' | 'compliance_threshold';
  message: string;
  metrics: Partial<ATSMetrics>;
  recommendations: string[];
}

/**
 * ATS Analytics Manager
 */
export class ATSAnalytics {
  private metrics: ATSMetrics[] = [];
  private alerts: ComplianceAlert[] = [];
  private readonly STORAGE_KEY = 'ats_analytics_metrics';
  private readonly ALERT_THRESHOLDS = {
    minOverallScore: 70,
    minTextExtractionScore: 85,
    maxErrorRate: 0.05, // 5%
    maxGenerationTime: 10000, // 10 seconds
    minSuccessRate: 0.95 // 95%
  };

  constructor() {
    this.loadMetrics();
  }

  /**
   * Track document generation and ATS compliance metrics
   */
  async trackGeneration(
    format: 'pdf' | 'docx',
    language: 'en' | 'de',
    generationTime: number,
    fileSize: number,
    success: boolean,
    atsScore: any,
    profileMetrics: ATSMetrics['profileMetrics'],
    jobMatching: ATSMetrics['jobMatching'],
    error?: string
  ): Promise<void> {
    const sessionId = this.getSessionId();
    
    const metrics: ATSMetrics = {
      timestamp: new Date(),
      sessionId,
      userId: this.getUserId(),
      
      documentGeneration: {
        format,
        language,
        generationTime,
        fileSize,
        success,
        error
      },
      
      atsCompliance: {
        overallScore: atsScore?.overall || 0,
        textExtractionScore: atsScore?.breakdown?.textExtraction || 0,
        fontComplianceScore: atsScore?.breakdown?.fontCompliance || 0,
        structureComplianceScore: atsScore?.breakdown?.structureCompliance || 0,
        keywordOptimizationScore: atsScore?.breakdown?.keywordOptimization || 0,
        formatComplianceScore: atsScore?.breakdown?.formatCompliance || 0,
        criticalIssuesCount: atsScore?.issues?.filter((i: any) => i.category === 'critical').length || 0,
        warningIssuesCount: atsScore?.issues?.filter((i: any) => i.category === 'warning').length || 0
      },
      
      profileMetrics,
      jobMatching
    };
    
    this.metrics.push(metrics);
    this.saveMetrics();
    
    // Check for compliance alerts
    await this.checkComplianceAlerts(metrics);
    
    // Log for debugging (remove in production)
    console.log('ATS Analytics tracked:', {
      format,
      language,
      overallScore: metrics.atsCompliance.overallScore,
      generationTime,
      success
    });
  }

  /**
   * Generate analytics summary for specified period
   */
  generateSummary(startDate: Date, endDate: Date): ATSAnalyticsSummary {
    const periodMetrics = this.metrics.filter(m => 
      m.timestamp >= startDate && m.timestamp <= endDate
    );
    
    if (periodMetrics.length === 0) {
      return this.getEmptySummary(startDate, endDate);
    }
    
    const totalGenerations = periodMetrics.length;
    const successfulGenerations = periodMetrics.filter(m => m.documentGeneration.success).length;
    const successRate = successfulGenerations / totalGenerations;
    
    // Format distribution
    const pdfCount = periodMetrics.filter(m => m.documentGeneration.format === 'pdf').length;
    const docxCount = periodMetrics.filter(m => m.documentGeneration.format === 'docx').length;
    
    // Language distribution
    const enCount = periodMetrics.filter(m => m.documentGeneration.language === 'en').length;
    const deCount = periodMetrics.filter(m => m.documentGeneration.language === 'de').length;
    
    // ATS compliance metrics
    const scores = periodMetrics.map(m => m.atsCompliance.overallScore);
    const averageOverallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const textExtractionScores = periodMetrics.map(m => m.atsCompliance.textExtractionScore);
    const averageTextExtractionScore = textExtractionScores.reduce((sum, score) => sum + score, 0) / textExtractionScores.length;
    
    const fontComplianceScores = periodMetrics.map(m => m.atsCompliance.fontComplianceScore);
    const averageFontComplianceScore = fontComplianceScores.reduce((sum, score) => sum + score, 0) / fontComplianceScores.length;
    
    // Score distribution
    const excellent = scores.filter(s => s >= 90).length;
    const good = scores.filter(s => s >= 70 && s < 90).length;
    const moderate = scores.filter(s => s >= 50 && s < 70).length;
    const poor = scores.filter(s => s < 50).length;
    
    // Issue analysis
    const totalCriticalIssues = periodMetrics.reduce((sum, m) => sum + m.atsCompliance.criticalIssuesCount, 0);
    const totalWarningIssues = periodMetrics.reduce((sum, m) => sum + m.atsCompliance.warningIssuesCount, 0);
    
    // Performance metrics
    const generationTimes = periodMetrics.map(m => m.documentGeneration.generationTime);
    const averageGenerationTime = generationTimes.reduce((sum, time) => sum + time, 0) / generationTimes.length;
    const fastestGeneration = Math.min(...generationTimes);
    const slowestGeneration = Math.max(...generationTimes);
    
    const pdfSizes = periodMetrics.filter(m => m.documentGeneration.format === 'pdf').map(m => m.documentGeneration.fileSize);
    const docxSizes = periodMetrics.filter(m => m.documentGeneration.format === 'docx').map(m => m.documentGeneration.fileSize);
    
    const averagePdfSize = pdfSizes.length > 0 ? pdfSizes.reduce((sum, size) => sum + size, 0) / pdfSizes.length : 0;
    const averageDocxSize = docxSizes.length > 0 ? docxSizes.reduce((sum, size) => sum + size, 0) / docxSizes.length : 0;
    
    return {
      period: { start: startDate, end: endDate },
      totalGenerations,
      successRate,
      averageGenerationTime,
      
      formatDistribution: {
        pdf: { count: pdfCount, percentage: (pdfCount / totalGenerations) * 100 },
        docx: { count: docxCount, percentage: (docxCount / totalGenerations) * 100 }
      },
      
      languageDistribution: {
        en: { count: enCount, percentage: (enCount / totalGenerations) * 100 },
        de: { count: deCount, percentage: (deCount / totalGenerations) * 100 }
      },
      
      complianceMetrics: {
        averageOverallScore,
        averageTextExtractionScore,
        averageFontComplianceScore,
        scoreDistribution: { excellent, good, moderate, poor }
      },
      
      issueAnalysis: {
        totalCriticalIssues,
        totalWarningIssues,
        commonIssueTypes: [] // Could be expanded to track specific issue types
      },
      
      performanceInsights: {
        fastestGeneration,
        slowestGeneration,
        averageFileSize: {
          pdf: averagePdfSize,
          docx: averageDocxSize
        }
      }
    };
  }

  /**
   * Get recent compliance alerts
   */
  getRecentAlerts(hours: number = 24): ComplianceAlert[] {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return this.alerts.filter(alert => alert.timestamp >= cutoffTime);
  }

  /**
   * Export analytics data for external analysis
   */
  exportData(startDate?: Date, endDate?: Date): {
    metrics: ATSMetrics[];
    summary: ATSAnalyticsSummary;
    alerts: ComplianceAlert[];
  } {
    const start = startDate || new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
    const end = endDate || new Date();
    
    const filteredMetrics = this.metrics.filter(m => 
      m.timestamp >= start && m.timestamp <= end
    );
    
    return {
      metrics: filteredMetrics,
      summary: this.generateSummary(start, end),
      alerts: this.alerts.filter(a => a.timestamp >= start && a.timestamp <= end)
    };
  }

  /**
   * Clear old metrics to prevent storage bloat
   */
  cleanupOldMetrics(daysToKeep: number = 90): void {
    const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoffDate);
    this.alerts = this.alerts.filter(a => a.timestamp >= cutoffDate);
    this.saveMetrics();
  }

  // Private helper methods

  private async checkComplianceAlerts(metrics: ATSMetrics): Promise<void> {
    const alerts: ComplianceAlert[] = [];
    
    // Check overall score degradation
    if (metrics.atsCompliance.overallScore < this.ALERT_THRESHOLDS.minOverallScore) {
      alerts.push({
        id: `score_degradation_${Date.now()}`,
        timestamp: new Date(),
        severity: 'critical',
        type: 'score_degradation',
        message: `ATS overall score (${metrics.atsCompliance.overallScore}) below threshold (${this.ALERT_THRESHOLDS.minOverallScore})`,
        metrics,
        recommendations: [
          'Review font compliance settings',
          'Check text extraction quality',
          'Validate document structure'
        ]
      });
    }
    
    // Check text extraction score
    if (metrics.atsCompliance.textExtractionScore < this.ALERT_THRESHOLDS.minTextExtractionScore) {
      alerts.push({
        id: `text_extraction_${Date.now()}`,
        timestamp: new Date(),
        severity: 'critical',
        type: 'compliance_threshold',
        message: `Text extraction score (${metrics.atsCompliance.textExtractionScore}) below threshold (${this.ALERT_THRESHOLDS.minTextExtractionScore})`,
        metrics,
        recommendations: [
          'Verify standard font usage',
          'Check for garbled text issues',
          'Review PDF generation settings'
        ]
      });
    }
    
    // Check generation time
    if (metrics.documentGeneration.generationTime > this.ALERT_THRESHOLDS.maxGenerationTime) {
      alerts.push({
        id: `performance_${Date.now()}`,
        timestamp: new Date(),
        severity: 'warning',
        type: 'performance_issue',
        message: `Document generation time (${metrics.documentGeneration.generationTime}ms) exceeds threshold (${this.ALERT_THRESHOLDS.maxGenerationTime}ms)`,
        metrics,
        recommendations: [
          'Optimize document generation process',
          'Check system resources',
          'Review content complexity'
        ]
      });
    }
    
    // Check critical issues count
    if (metrics.atsCompliance.criticalIssuesCount > 0) {
      alerts.push({
        id: `critical_issues_${Date.now()}`,
        timestamp: new Date(),
        severity: 'critical',
        type: 'compliance_threshold',
        message: `${metrics.atsCompliance.criticalIssuesCount} critical ATS compliance issues detected`,
        metrics,
        recommendations: [
          'Address critical compliance issues immediately',
          'Review ATS validation results',
          'Update document generation settings'
        ]
      });
    }
    
    this.alerts.push(...alerts);
    
    // Keep only recent alerts to prevent memory bloat
    const oneWeekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
    this.alerts = this.alerts.filter(alert => alert.timestamp >= oneWeekAgo);
  }

  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('ats_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('ats_session_id', sessionId);
      }
      return sessionId;
    }
    return `server_session_${Date.now()}`;
  }

  private getUserId(): string | undefined {
    // In a real implementation, this would get the authenticated user ID
    return undefined;
  }

  private loadMetrics(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          this.metrics = data.metrics?.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })) || [];
          this.alerts = data.alerts?.map((a: any) => ({
            ...a,
            timestamp: new Date(a.timestamp)
          })) || [];
        }
      } catch (error) {
        console.warn('Failed to load ATS analytics metrics:', error);
        this.metrics = [];
        this.alerts = [];
      }
    }
  }

  private saveMetrics(): void {
    if (typeof window !== 'undefined') {
      try {
        const data = {
          metrics: this.metrics,
          alerts: this.alerts
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save ATS analytics metrics:', error);
      }
    }
  }

  private getEmptySummary(startDate: Date, endDate: Date): ATSAnalyticsSummary {
    return {
      period: { start: startDate, end: endDate },
      totalGenerations: 0,
      successRate: 0,
      averageGenerationTime: 0,
      formatDistribution: {
        pdf: { count: 0, percentage: 0 },
        docx: { count: 0, percentage: 0 }
      },
      languageDistribution: {
        en: { count: 0, percentage: 0 },
        de: { count: 0, percentage: 0 }
      },
      complianceMetrics: {
        averageOverallScore: 0,
        averageTextExtractionScore: 0,
        averageFontComplianceScore: 0,
        scoreDistribution: { excellent: 0, good: 0, moderate: 0, poor: 0 }
      },
      issueAnalysis: {
        totalCriticalIssues: 0,
        totalWarningIssues: 0,
        commonIssueTypes: []
      },
      performanceInsights: {
        fastestGeneration: 0,
        slowestGeneration: 0,
        averageFileSize: { pdf: 0, docx: 0 }
      }
    };
  }
}

// Global analytics instance
export const atsAnalytics = new ATSAnalytics();