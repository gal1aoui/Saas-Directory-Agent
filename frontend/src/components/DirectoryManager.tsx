import React, { useState } from 'react';
import { useDirectories, useAsync } from '../hooks';
import { api } from '../services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, X, Save, Globe } from 'lucide-react';
import { type Directory, type DirectoryCreate, DirectoryCreateSchema, type DirectoryStatus } from '../types/schema';

const DirectoryManager: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<DirectoryStatus | ''>('');
  const { data: directories, loading, refetch } = useDirectories({
    status: statusFilter || undefined
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDirectory, setEditingDirectory] = useState<Directory | null>(null);

  const handleEdit = (directory: Directory) => {
    setEditingDirectory(directory);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this directory?')) return;
    
    try {
      await api.deleteDirectory(id);
      refetch();
    } catch (error) {
      console.error('Error deleting directory:', error);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDirectory(null);
  };

  const handleSuccess = () => {
    handleCloseForm();
    refetch();
  };

  const getSuccessRate = (dir: Directory): number => {
    if (dir.total_submissions === 0) return 0;
    return (dir.successful_submissions / dir.total_submissions) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Directories</h1>
            <p className="text-gray-600 mt-2">Manage your directory list</p>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DirectoryStatus | '')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="testing">Testing</option>
            </select>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="h-5 w-5" />
              Add Directory
            </button>
          </div>
        </div>

        {/* Directories Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : directories.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No directories yet</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Add Your First Directory
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Directory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {directories.map((directory) => (
                    <tr key={directory.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {directory.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {directory.url}
                          </div>
                          {directory.category && (
                            <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              {directory.category}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(directory.status)}`}>
                          {directory.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {directory.domain_authority || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {directory.total_submissions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  getSuccessRate(directory) >= 70 ? 'bg-green-500' :
                                  getSuccessRate(directory) >= 40 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${getSuccessRate(directory)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-gray-700 min-w-12">
                            {getSuccessRate(directory).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(directory)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(directory.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {isFormOpen && (
          <DirectoryForm
            directory={editingDirectory}
            onClose={handleCloseForm}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
};

const getStatusBadgeColor = (status: DirectoryStatus): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    case 'testing':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface DirectoryFormProps {
  directory: Directory | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DirectoryForm: React.FC<DirectoryFormProps> = ({ directory, onClose, onSuccess }) => {
  const isEditing = !!directory;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<DirectoryCreate>({
    resolver: zodResolver(DirectoryCreateSchema),
    defaultValues: directory ? {
      name: directory.name,
      url: directory.url,
      submission_url: directory.submission_url || undefined,
      status: directory.status,
      domain_authority: directory.domain_authority || undefined,
      category: directory.category || undefined,
      requires_approval: directory.requires_approval,
      estimated_approval_time: directory.estimated_approval_time || undefined
    } : {
      status: 'active',
      requires_approval: true
    }
  });

  const { execute: saveDirectory, loading } = useAsync(
    async (data: DirectoryCreate) => {
      if (isEditing) {
        return api.updateDirectory(directory.id, data);
      } else {
        return api.createDirectory(data);
      }
    }
  );

  const onSubmit = async (data: DirectoryCreate) => {
    try {
      await saveDirectory(data);
      onSuccess();
    } catch (error: any) {
      alert(error.detail || 'Failed to save directory');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit' : 'Add'} Directory
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Directory Name *
              </label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Product Hunt"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Directory URL *
              </label>
              <input
                {...register('url')}
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://www.producthunt.com"
              />
              {errors.url && (
                <p className="text-red-600 text-sm mt-1">{errors.url.message}</p>
              )}
            </div>

            {/* Submission URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Submission URL
              </label>
              <input
                {...register('submission_url')}
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://www.producthunt.com/posts/new"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use main URL
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="testing">Testing</option>
                </select>
              </div>

              {/* Domain Authority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain Authority (0-100)
                </label>
                <input
                  {...register('domain_authority', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="85"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                {...register('category')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tech Discovery"
              />
            </div>

            {/* Requires Approval */}
            <div className="flex items-center gap-2">
              <input
                {...register('requires_approval')}
                type="checkbox"
                id="requires_approval"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requires_approval" className="text-sm font-medium text-gray-700">
                Requires Manual Approval
              </label>
            </div>

            {/* Estimated Approval Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Approval Time
              </label>
              <input
                {...register('estimated_approval_time')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="24 hours"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DirectoryManager;