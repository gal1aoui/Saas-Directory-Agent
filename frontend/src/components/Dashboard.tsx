import React from 'react';
import { useDashboardStats, useSubmissions } from '../store';
import { 
  CheckCircle, XCircle, Clock, Send, TrendingUp, 
  Database, Globe, AlertCircle, type LucideIcon 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { SubmissionStatus } from '../types/schema';
import { format } from 'date-fns';

interface StatCard {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  iconColor: string;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // Index signature for Recharts
}

const Dashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats, error: statsError } = useDashboardStats();
  const { data: recentSubmissions = [], isLoading: submissionsLoading } = useSubmissions({ limit: 10 });

  const loading = statsLoading || submissionsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load dashboard data</p>
          <button
            onClick={() => refetchStats()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      title: 'Total Submissions',
      value: stats.total_submissions,
      icon: Send,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Approved',
      value: stats.approved_submissions,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Pending',
      value: stats.pending_submissions,
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'Failed',
      value: stats.failed_submissions,
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    }
  ];

  const chartData: ChartData[] = [
    { name: 'Approved', value: stats.approved_submissions, color: '#10b981' },
    { name: 'Submitted', value: stats.submitted_submissions, color: '#3b82f6' },
    { name: 'Pending', value: stats.pending_submissions, color: '#f59e0b' },
    { name: 'Failed', value: stats.failed_submissions, color: '#ef4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your SaaS directory submissions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Success Rate</h2>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-end">
              <span className="text-5xl font-bold text-green-600">
                {stats.success_rate.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Based on {stats.total_submissions} total submissions
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Directories</h2>
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Directories</span>
                <span className="text-2xl font-bold text-gray-900">
                  {stats.total_directories}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Directories</span>
                <span className="text-2xl font-bold text-green-600">
                  {stats.active_directories}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Submissions Breakdown
            </h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent ?? 0 * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-75 text-gray-500">
                <div className="text-center">
                  <Database className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No submissions yet</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Submissions
            </h2>
            <div className="space-y-3">
              {recentSubmissions.slice(0, 5).map((submission) => (
                <div 
                  key={submission.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <StatusIcon status={submission.status} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {submission.directory.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {format(new Date(submission.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                </div>
              ))}
              {recentSubmissions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No submissions yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusIcon: React.FC<{ status: SubmissionStatus }> = ({ status }) => {
  const iconClass = "h-5 w-5";
  
  switch (status) {
    case 'approved':
      return <CheckCircle className={`${iconClass} text-green-600`} />;
    case 'submitted':
      return <Send className={`${iconClass} text-blue-600`} />;
    case 'pending':
      return <Clock className={`${iconClass} text-yellow-600`} />;
    case 'failed':
      return <XCircle className={`${iconClass} text-red-600`} />;
    case 'rejected':
      return <XCircle className={`${iconClass} text-red-600`} />;
    default:
      return <AlertCircle className={`${iconClass} text-gray-600`} />;
  }
};

const getStatusColor = (status: SubmissionStatus): string => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'submitted':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default Dashboard;