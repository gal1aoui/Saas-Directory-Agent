import React, { useState } from 'react';
import { useSaasProducts, useDeleteSaasProduct, useCreateSaasProduct, useUpdateSaasProduct } from '../store';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { type SaasProduct, type SaasProductCreate, SaasProductCreateSchema } from '../types/schema';

const SaasManager: React.FC = () => {
  const { data: products = [], isLoading } = useSaasProducts();
  const deleteMutation = useDeleteSaasProduct();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SaasProduct | null>(null);

  const handleEdit = (product: SaasProduct) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this SaaS product?')) return;
    
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleSuccess = () => {
    handleCloseForm();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SaaS Products</h1>
            <p className="text-gray-600 mt-2">Manage your SaaS products</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="h-5 w-5" />
            Add Product
          </button>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No SaaS products yet</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow p-6">
                {product.logo_url && (
                  <img 
                    src={product.logo_url} 
                    alt={product.name}
                    className="w-16 h-16 rounded-lg mb-4 object-cover"
                  />
                )}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <p className="text-sm text-blue-600 mb-2 truncate">
                  {product.website_url}
                </p>
                {product.tagline && (
                  <p className="text-sm text-gray-600 mb-3 italic">
                    "{product.tagline}"
                  </p>
                )}
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {product.description}
                </p>
                <div className="flex gap-2 mb-4">
                  {product.category && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {product.category}
                    </span>
                  )}
                  {product.pricing_model && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {product.pricing_model}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {isFormOpen && (
          <SaasProductForm
            product={editingProduct}
            onClose={handleCloseForm}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
};

interface SaasProductFormProps {
  product: SaasProduct | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SaasProductForm: React.FC<SaasProductFormProps> = ({ product, onClose, onSuccess }) => {
  const isEditing = !!product;
  
  const createMutation = useCreateSaasProduct();
  const updateMutation = useUpdateSaasProduct();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SaasProductCreate>({
    resolver: zodResolver(SaasProductCreateSchema),
    defaultValues: product ? {
      name: product.name,
      website_url: product.website_url,
      description: product.description,
      short_description: product.short_description || undefined,
      category: product.category || undefined,
      logo_url: product.logo_url || undefined,
      contact_email: product.contact_email,
      tagline: product.tagline || undefined,
      pricing_model: product.pricing_model || undefined,
      features: product.features || undefined,
      social_links: product.social_links || undefined
    } : undefined
  });

  const onSubmit: SubmitHandler<SaasProductCreate> = async (data) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: product.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onSuccess();
    } catch (error: any) {
      alert(error.detail || 'Failed to save product');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit' : 'Add'} SaaS Product
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="My Awesome SaaS"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website URL *
              </label>
              <input
                {...register('website_url')}
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://myawesomesaas.com"
              />
              {errors.website_url && (
                <p className="text-red-600 text-sm mt-1">{errors.website_url.message}</p>
              )}
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email *
              </label>
              <input
                {...register('contact_email')}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="hello@myawesomesaas.com"
              />
              {errors.contact_email && (
                <p className="text-red-600 text-sm mt-1">{errors.contact_email.message}</p>
              )}
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tagline
              </label>
              <input
                {...register('tagline')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Revolutionary SaaS platform"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Detailed description of your product..."
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <input
                {...register('short_description')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief one-liner"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  {...register('category')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Productivity"
                />
              </div>

              {/* Pricing Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pricing Model
                </label>
                <input
                  {...register('pricing_model')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Freemium"
                />
              </div>
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <input
                {...register('logo_url')}
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://myawesomesaas.com/logo.png"
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
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SaasManager;