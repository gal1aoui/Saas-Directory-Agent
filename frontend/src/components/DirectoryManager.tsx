import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Globe, Plus, Save, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  useCreateDirectory,
  useDeleteDirectory,
  useDirectories,
  useUpdateDirectory,
} from "../store";
import {
  type Directory,
  type DirectoryCreate,
  DirectoryCreateSchema,
  type DirectoryStatus,
} from "../types/schema";
import {
  Card,
  CardContent,
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const DirectoryManager: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<DirectoryStatus>("all");
  const { data: directories = [], isLoading } = useDirectories({
    status: statusFilter || undefined,
  });
  const deleteMutation = useDeleteDirectory();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDirectory, setEditingDirectory] = useState<Directory | null>(
    null,
  );

  const handleEdit = (directory: Directory) => {
    setEditingDirectory(directory);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: "Directory deleted",
        description: "Directory has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting directory:", error);
      toast({
        title: "Error",
        description: "Failed to delete directory",
        variant: "destructive",
      });
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDirectory(null);
  };

  const handleSuccess = () => {
    handleCloseForm();
  };

  const getSuccessRate = (dir: Directory): number => {
    if (dir.total_submissions === 0) return 0;
    return (dir.successful_submissions / dir.total_submissions) * 100;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Directories</h1>
            <p className="text-muted-foreground mt-2">
              Manage your directory submission targets
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DirectoryStatus | "all")}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Directory
            </Button>
          </div>
        </div>

        {/* Directories Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">
                Loading directories...
              </p>
            </div>
          </div>
        ) : directories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-muted p-3">
                  <Globe className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">No directories yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add your first directory to start submitting
                  </p>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Directory
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Directory</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>DA</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {directories.map((directory) => (
                    <TableRow key={directory.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{directory.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {directory.url}
                          </div>
                          {directory.category && (
                            <Badge variant="info" className="mt-1">
                              {directory.category}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(directory.status)}>
                          {directory.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {directory.domain_authority || "-"}
                      </TableCell>
                      <TableCell>{directory.total_submissions}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 w-24">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  getSuccessRate(directory) >= 70
                                    ? "bg-green-500"
                                    : getSuccessRate(directory) >= 40
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{
                                  width: `${getSuccessRate(directory)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground min-w-12">
                            {getSuccessRate(directory).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(directory)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(directory.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DirectoryForm
            directory={editingDirectory}
            onClose={handleCloseForm}
            onSuccess={handleSuccess}
          />
        </Dialog>
      </div>
    </div>
  );
};

const getStatusVariant = (
  status: DirectoryStatus
): "success" | "warning" | "default" => {
  switch (status) {
    case "active":
      return "success";
    case "testing":
      return "warning";
    default:
      return "default";
  }
};

interface DirectoryFormProps {
  directory: Directory | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DirectoryForm: React.FC<DirectoryFormProps> = ({
  directory,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!directory;
  const { toast } = useToast();

  const createMutation = useCreateDirectory();
  const updateMutation = useUpdateDirectory();

  const form = useForm<DirectoryCreate>({
    resolver: zodResolver(DirectoryCreateSchema),
    defaultValues: directory
      ? {
          name: directory.name,
          url: directory.url,
          submission_url: directory.submission_url || undefined,
          status: directory.status,
          domain_authority: directory.domain_authority || undefined,
          category: directory.category || undefined,
          requires_approval: directory.requires_approval,
          estimated_approval_time:
            directory.estimated_approval_time || undefined,
          requires_login: directory.requires_login || false,
          login_url: directory.login_url || undefined,
          login_username: directory.login_username || undefined,
          login_password: directory.login_password || undefined,
        }
      : {
          name: "",
          url: "",
          status: "active",
          requires_approval: true,
          requires_login: false,
        },
  });

  const requiresLogin = form.watch("requires_login");

  const onSubmit = async (data: DirectoryCreate) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: directory.id, data });
        toast({
          title: "Directory updated",
          description: "Directory has been updated successfully",
        });
      } else {
        await createMutation.mutateAsync(data);
        toast({
          title: "Directory created",
          description: "Directory has been created successfully",
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.detail || "Failed to save directory",
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Edit" : "Add"} Directory
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update directory information and settings"
            : "Add a new directory to submit your SaaS products"}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Directory Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Product Hunt" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Directory URL *</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://www.producthunt.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="submission_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Submission URL</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://www.producthunt.com/posts/new"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Leave empty to use main URL
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domain_authority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain Authority (0-100)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="85"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="Tech Discovery" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="requires_approval"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Requires Manual Approval</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimated_approval_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Approval Time</FormLabel>
                <FormControl>
                  <Input placeholder="24 hours" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Login Section */}
          <div className="border-t pt-4 mt-4 space-y-4">
            <h3 className="text-sm font-semibold">Login Settings</h3>

            <FormField
              control={form.control}
              name="requires_login"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Requires Login</FormLabel>
                    <FormDescription>
                      Enable if directory requires authentication
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {requiresLogin && (
              <>
                <FormField
                  control={form.control}
                  name="login_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://example.com/login"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="login_username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="login_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
          </div>


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

export default DirectoryManager;
