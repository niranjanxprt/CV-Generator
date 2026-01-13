/**
 * ATS Compliance Dashboard Component
 * 
 * Displays real-time ATS compliance metrics, performance tracking,
 * and compliance alerts for monitoring system health.
 * 
 * Requirements: 20.1, 20.2, 20.4 - ATS compliance metrics tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText,
  Download,
  Activity
} from 'lucide-react';

interface DashboardData {
  summary: any;
  alerts: any[];
  period: {
    start: string;
    end: string;
    label: string;
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
  status?: 'good' | 'warning' | 'critical';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  description, 
  status = 'good' 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={getStatusColor()}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground">
            {change > 0 ? (
              <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
            )}
            {Math.abs(change).toFixed(1)}% from last period
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export const ATSComplianceDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?period=${period}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result);
        setError(null);
      } else {
        setError(result.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError('Network error loading dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: 'json' | 'csv' = 'csv') => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ats-analytics-export.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        // Handle JSON export data as needed
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Dashboard Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          Retry Loading
        </Button>
      </div>
    );
  }

  const { summary, alerts } = data;

  // Prepare chart data
  const formatData = [
    { name: 'PDF', value: summary.formatDistribution.pdf.count, percentage: summary.formatDistribution.pdf.percentage },
    { name: 'DOCX', value: summary.formatDistribution.docx.count, percentage: summary.formatDistribution.docx.percentage }
  ];

  const scoreDistributionData = [
    { name: 'Excellent (90-100)', value: summary.complianceMetrics.scoreDistribution.excellent, color: '#10b981' },
    { name: 'Good (70-89)', value: summary.complianceMetrics.scoreDistribution.good, color: '#3b82f6' },
    { name: 'Moderate (50-69)', value: summary.complianceMetrics.scoreDistribution.moderate, color: '#f59e0b' },
    { name: 'Poor (0-49)', value: summary.complianceMetrics.scoreDistribution.poor, color: '#ef4444' }
  ];

  const getComplianceStatus = (score: number) => {
    if (score >= 85) return 'good';
    if (score >= 70) return 'warning';
    return 'critical';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ATS Compliance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor ATS compliance metrics and performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => exportData('csv')} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Recent Alerts</h3>
          {alerts.slice(0, 3).map((alert, index) => (
            <Alert key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alert.type.replace('_', ' ').toUpperCase()}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Generations"
          value={summary.totalGenerations.toLocaleString()}
          icon={<FileText className="h-4 w-4" />}
          description="Documents generated in period"
        />
        <MetricCard
          title="Success Rate"
          value={`${(summary.successRate * 100).toFixed(1)}%`}
          icon={<CheckCircle className="h-4 w-4" />}
          status={summary.successRate >= 0.95 ? 'good' : summary.successRate >= 0.90 ? 'warning' : 'critical'}
          description="Generation success rate"
        />
        <MetricCard
          title="Avg ATS Score"
          value={`${summary.complianceMetrics.averageOverallScore.toFixed(1)}/100`}
          icon={<Activity className="h-4 w-4" />}
          status={getComplianceStatus(summary.complianceMetrics.averageOverallScore)}
          description="Average ATS compliance score"
        />
        <MetricCard
          title="Avg Generation Time"
          value={`${(summary.averageGenerationTime / 1000).toFixed(1)}s`}
          icon={<Clock className="h-4 w-4" />}
          status={summary.averageGenerationTime < 5000 ? 'good' : summary.averageGenerationTime < 10000 ? 'warning' : 'critical'}
          description="Average document generation time"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Format Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Format Distribution</CardTitle>
            <CardDescription>PDF vs DOCX usage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>ATS Score Distribution</CardTitle>
            <CardDescription>Quality of generated documents</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {scoreDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Text Extraction</CardTitle>
            <CardDescription>ATS parsing capability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.complianceMetrics.averageTextExtractionScore.toFixed(1)}/100
            </div>
            <div className="text-sm text-muted-foreground">
              Average text extraction score
            </div>
            <div className="mt-2">
              <Badge variant={getComplianceStatus(summary.complianceMetrics.averageTextExtractionScore) === 'good' ? 'default' : 'destructive'}>
                {summary.complianceMetrics.averageTextExtractionScore >= 85 ? 'Excellent' : 
                 summary.complianceMetrics.averageTextExtractionScore >= 70 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Font Compliance</CardTitle>
            <CardDescription>Standard font usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.complianceMetrics.averageFontComplianceScore.toFixed(1)}/100
            </div>
            <div className="text-sm text-muted-foreground">
              Average font compliance score
            </div>
            <div className="mt-2">
              <Badge variant={getComplianceStatus(summary.complianceMetrics.averageFontComplianceScore) === 'good' ? 'default' : 'destructive'}>
                {summary.complianceMetrics.averageFontComplianceScore >= 85 ? 'Excellent' : 
                 summary.complianceMetrics.averageFontComplianceScore >= 70 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>System performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-sm font-medium">Fastest Generation</div>
                <div className="text-lg">{(summary.performanceInsights.fastestGeneration / 1000).toFixed(2)}s</div>
              </div>
              <div>
                <div className="text-sm font-medium">Slowest Generation</div>
                <div className="text-lg">{(summary.performanceInsights.slowestGeneration / 1000).toFixed(2)}s</div>
              </div>
              <div>
                <div className="text-sm font-medium">Avg File Size</div>
                <div className="text-lg">
                  PDF: {(summary.performanceInsights.averageFileSize.pdf / 1024).toFixed(0)}KB<br />
                  DOCX: {(summary.performanceInsights.averageFileSize.docx / 1024).toFixed(0)}KB
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default ATSComplianceDashboard;