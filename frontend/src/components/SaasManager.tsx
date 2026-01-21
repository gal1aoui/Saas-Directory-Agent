import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, Save, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  useCreateSaasProduct,
  useDeleteSaasProduct,
  useSaasProducts,
  useUpdateSaasProduct,
} from "../store";
import {
  type SaasProduct,
  type SaasProductCreate,
  SaasProductCreateSchema,
} from "../types/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const SaasManager: React.FC = () => {
  const { data: products = [], isLoading } = useSaasProducts();
  const deleteMutation = useDeleteSaasProduct();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SaasProduct | null>(
    null,
  );

  const handleEdit = (product: SaasProduct) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: "Product deleted",
        description: "SaaS product has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SaaS Products</h1>
            <p className="text-muted-foreground mt-2">
              Manage your SaaS products for directory submissions
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">
                Loading products...
              </p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-muted p-3">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">No products yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get started by adding your first SaaS product
                  </p>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      {product.logo_url && (
                        <img
                          src={product.logo_url}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {product.name}
                        </CardTitle>
                        {product.tagline && (
                          <CardDescription className="text-sm italic line-clamp-1">
                            "{product.tagline}"
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <a
                    href={product.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate block"
                  >
                    {product.website_url}
                  </a>

                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {product.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {product.category && (
                      <Badge variant="info">{product.category}</Badge>
                    )}
                    {product.pricing_model && (
                      <Badge variant="success">{product.pricing_model}</Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      disabled={deleteMutation.isPending}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SaasProductForm
            product={editingProduct}
            onClose={handleCloseForm}
            onSuccess={handleSuccess}
          />
        </Dialog>
      </div>
    </div>
  );
};

interface SaasProductFormProps {
  product: SaasProduct | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SaasProductForm: React.FC<SaasProductFormProps> = ({
  product,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!product;
  const { toast } = useToast();

  const createMutation = useCreateSaasProduct();
  const updateMutation = useUpdateSaasProduct();

  const form = useForm<SaasProductCreate>({
    resolver: zodResolver(SaasProductCreateSchema),
    defaultValues: product
      ? {
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
          social_links: product.social_links || undefined,
        }
      : {
          name: "",
          website_url: "",
          description: "",
          contact_email: "",
        },
  });

  const onSubmit = async (data: SaasProductCreate) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: product.id, data });
        toast({
          title: "Product updated",
          description: "SaaS product has been updated successfully",
        });
      } else {
        await createMutation.mutateAsync(data);
        toast({
          title: "Product created",
          description: "SaaS product has been created successfully",
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.detail || "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Edit" : "Add"} SaaS Product
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update the details of your SaaS product"
            : "Add a new SaaS product to submit to directories"}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input placeholder="My Awesome SaaS" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website URL *</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://myawesomesaas.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="hello@myawesomesaas.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tagline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tagline</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Revolutionary SaaS platform"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder="Detailed description of your product..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="short_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Description</FormLabel>
                <FormControl>
                  <Input placeholder="Brief one-liner" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Productivity" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricing_model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pricing Model</FormLabel>
                  <FormControl>
                    <Input placeholder="Freemium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="logo_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo URL</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://myawesomesaas.com/logo.png"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              <Save className="h-4 w-4 mr-2" />
              {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default SaasManager;
