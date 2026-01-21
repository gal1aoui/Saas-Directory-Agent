import { Edit, Globe, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import {
  useDeleteDirectory,
  useDirectories,
} from "../../store";
import type { Directory, DirectoryStatus } from "../../types/schema";
import { DirectoryForm } from "./DirectoryForm";
import { getStatusVariant, getSuccessRate } from "./utils";

const DirectoryManager: React.FC = () => {
  const [statusFilter, setStatusFilter] =
    useState<DirectoryStatus | "all">("all");
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
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as DirectoryStatus | "all")
              }
            >
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
                      <TableCell>{directory.domain_authority || "-"}</TableCell>
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

export default DirectoryManager;
