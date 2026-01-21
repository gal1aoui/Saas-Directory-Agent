import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import type React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
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
import { useToast } from "@/hooks/use-toast";
import { useCreateSaasProduct, useUpdateSaasProduct } from "../../store";
import {
  type SaasProduct,
  type SaasProductCreate,
  SaasProductCreateSchema,
} from "../../types/schema";

interface SaasProductFormProps {
  product: SaasProduct | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SaasProductForm: React.FC<SaasProductFormProps> = ({
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
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          (error as { detail?: string }).detail || "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit" : "Add"} SaaS Product</DialogTitle>
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
                  <Input placeholder="Revolutionary SaaS platform" {...field} />
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
