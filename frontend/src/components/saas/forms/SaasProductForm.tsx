import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCreateSaasProduct, useUpdateSaasProduct } from "@/store";
import {
  type SaasProduct,
  type SaasProductCreate,
  SaasProductCreateSchema,
} from "@/types/schema";

interface SaasProductFormProps {
  data?: SaasProduct;
  close: () => void;
}

export const SaasProductForm: React.FC<SaasProductFormProps> = ({ data: product, close }) => {
  const isEditing = !!product;
  const { toast } = useToast();

  const createMutation = useCreateSaasProduct();
  const updateMutation = useUpdateSaasProduct();

  // State for managing features array
  const [newFeature, setNewFeature] = useState("");

  const form = useForm<SaasProductCreate>({
    resolver: zodResolver(SaasProductCreateSchema),
    defaultValues: product
      ? {
          name: product.name || "",
          website_url: product.website_url || "",
          description: product.description || "",
          short_description: product.short_description || "",
          category: product.category || "",
          logo_url: product.logo_url || "",
          contact_email: product.contact_email || "",
          tagline: product.tagline || "",
          pricing_model: product.pricing_model || "",
          features: product.features || [],
          social_links: product.social_links || {
            twitter: "",
            linkedin: "",
            facebook: "",
            github: "",
          },
        }
      : {
          name: "",
          website_url: "",
          description: "",
          contact_email: "",
          features: [],
          social_links: {
            twitter: "",
            linkedin: "",
            facebook: "",
            github: "",
          },
        },
  });

  const onSubmit = async (data: SaasProductCreate) => {
    try {
      if (isEditing && product) {
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
      close();
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

  const features = form.watch("features") || [];

  const addFeature = () => {
    if (newFeature.trim()) {
      form.setValue("features", [...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    form.setValue(
      "features",
      features.filter((_, i) => i !== index),
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="required" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="required">Product Details</TabsTrigger>
            <TabsTrigger value="optional">Additional Details</TabsTrigger>
          </TabsList>

          {/* Required Fields Tab */}
          <TabsContent value="required" className="space-y-4">
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
          </TabsContent>

          {/* Optional Fields Tab */}
          <TabsContent value="optional" className="space-y-4">
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

            {/* Features Section */}
            <div className="border-t pt-4 mt-4 space-y-4">
              <h3 className="text-sm font-semibold">Features</h3>
              <FormItem>
                <FormLabel>Add Features</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter a feature"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addFeature}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <FormDescription>
                  Press Enter or click + to add a feature
                </FormDescription>
              </FormItem>

              {features.length > 0 && (
                <div className="space-y-2">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm">{feature}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Social Links Section */}
            <div className="border-t pt-4 mt-4 space-y-4">
              <h3 className="text-sm font-semibold">Social Links</h3>

              <FormField
                control={form.control}
                name="social_links.twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://twitter.com/yourproduct"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="social_links.linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://linkedin.com/company/yourproduct"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="social_links.facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://facebook.com/yourproduct"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="social_links.github"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://github.com/yourproduct"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={close} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
