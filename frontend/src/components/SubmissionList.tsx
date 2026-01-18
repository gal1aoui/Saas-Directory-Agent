import React, { useState, useMemo } from 'react';
import { useSubmissions, useRetrySubmission } from '../store';
import { 
  RefreshCw, Filter, Search, ExternalLink, 
  CheckCircle, XCircle, Clock, Send, X 
} from 'lucide-react';
import type { SubmissionStatus, SubmissionWithDetails } from '../types/schema';
import { format } from 'date-fns';
import { useDebounce } from '../utils/use-debounce';

const SubmissionList: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const { data: submissions = [], isLoading, refetch } = useSubmissions({
    status: statusFilter || undefined
  });

  const retryMutation = useRetrySubmission();

  const handleRetry = async (submissionId: number) => {
    try {
      await retryMutation.mutateAsync(submissionId);
    } catch (error) {
      console.error('Error retrying submission:', error);
    }
  };

  const filteredSubmissions = useMemo(() => {
    if (!debouncedSearch) return submissions;
    
    const searchLower = debouncedSearch.toLowerCase();
    return submissions.filter(sub => 
      sub.directory.name.toLowerCase().includes(searchLower) ||
      sub.saas_product.name.toLowerCase().includes(searchLower)
    );
  }, [submissions, debouncedSearch]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Submissions</h1>
          <p className="text-gray-600 mt-2">Track all your directory submissions</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus | '')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="failed">Failed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Directory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SaaS Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      </div>
                    </td>
                  </tr>
                ) : filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No submissions found
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {submission.directory.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {submission.directory.url}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {submission.saas_product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                          <StatusIcon status={submission.status} />
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission.submitted_at 
                          ? format(new Date(submission.submitted_at), 'MMM dd, yyyy')
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {submission.listing_url && (
                            <a
                              href={submission.listing_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                              title="View listing"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          {submission.status === 'failed' && (
                            <button
                              onClick={() => handleRetry(submission.id)}
                              disabled={retryMutation.isPending}
                              className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                              title="Retry submission"
                            >
                              <RefreshCw className={`h-4 w-4 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedSubmission(submission)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        {selectedSubmission && (
          <SubmissionDetailsModal
            submission={selectedSubmission}
            onClose={() => setSelectedSubmission(null)}
          />
        )}
      </div>
    </div>
  );
};

const StatusIcon: React.FC<{ status: SubmissionStatus }> = ({ status }) => {
  const iconClass = "h-3 w-3";
  
  switch (status) {
    case 'approved':
      return <CheckCircle className={iconClass} />;
    case 'submitted':
      return <Send className={iconClass} />;
    case 'pending':
      return <Clock className={iconClass} />;
    case 'failed':
    case 'rejected':
      return <XCircle className={iconClass} />;
    default:
      return null;
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

interface SubmissionDetailsModalProps {
  submission: SubmissionWithDetails;
  onClose: () => void;
}

const SubmissionDetailsModal: React.FC<SubmissionDetailsModalProps> = ({ submission, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Submission Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Directory
              </label>
              <p className="text-gray-900">{submission.directory.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SaaS Product
              </label>
              <p className="text-gray-900">{submission.saas_product.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                {submission.status}
              </span>
            </div>

            {submission.response_message && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Response Message
                </label>
                <p className="text-gray-900">{submission.response_message}</p>
              </div>
            )}

            {submission.listing_url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Listing URL
                </label>
                <a
                  href={submission.listing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all"
                >
                  {submission.listing_url}
                </a>
              </div>
            )}

            {submission.retry_count > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retry Count
                </label>
                <p className="text-gray-900">
                  {submission.retry_count} / {submission.max_retries}
                </p>
              </div>
            )}

            {submission.error_log && submission.error_log.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Error Log
                </label>
                <div className="bg-red-50 rounded p-3 text-sm text-red-800 max-h-40 overflow-y-auto">
                  {submission.error_log.map((error, i) => (
                    <div key={i} className="mb-2">
                      <span className="font-medium">{error.timestamp}</span>: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionList;