import { AlertCircle, Loader, Send } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useBulkSubmit, useDirectories, useSaasProducts } from "../store";
import type { Submission } from "../types/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface BulkSubmitResult {
  success: boolean;
  message: string;
  submissions?: Submission[];
}

const BulkSubmit: React.FC = () => {
  const { data: saasProducts = [], isLoading: loadingSaas } = useSaasProducts();
  const { data: directories = [], isLoading: loadingDirs } = useDirectories({
    status: "active",
  });

  const [selectedSaas, setSelectedSaas] = useState<string>("");
  const [selectedDirectories, setSelectedDirectories] = useState<number[]>([]);
  const [result, setResult] = useState<BulkSubmitResult | null>(null);

  const bulkSubmitMutation = useBulkSubmit();
  const { toast } = useToast();

  const toggleDirectory = (dirId: number) => {
    setSelectedDirectories((prev) =>
      prev.includes(dirId)
        ? prev.filter((id) => id !== dirId)
        : [...prev, dirId],
    );
  };

  const selectAll = () => {
    if (selectedDirectories.length === directories.length) {
      setSelectedDirectories([]);
    } else {
      setSelectedDirectories(directories.map((d) => d.id));
    }
  };

  const handleSubmit = async () => {
    if (!selectedSaas || selectedDirectories.length === 0) {
      toast({
        title: "Selection required",
        description: "Please select a SaaS product and at least one directory",
        variant: "destructive",
      });
      return;
    }

    try {
      setResult(null);

      const submissions = await bulkSubmitMutation.mutateAsync({
        saas_product_id: Number(selectedSaas),
        directory_ids: selectedDirectories,
      });

      const successCount = submissions.filter(
        (s) => s.status === "submitted",
      ).length;
      const failedCount = submissions.filter(
        (s) => s.status === "failed",
      ).length;

      const message = `Submitted to ${submissions.length} directories (${successCount} successful, ${failedCount} failed)`;

      setResult({
        success: true,
        message,
        submissions,
      });

      toast({
        title: "Bulk submission completed",
        description: message,
      });

      // Reset selections
      setSelectedDirectories([]);
    } catch (error: any) {
      const errorMessage = error.detail || "Something went wrong";
      setResult({
        success: false,
        message: `Error: ${errorMessage}`,
      });

      toast({
        title: "Submission failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const loading = loadingSaas || loadingDirs;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Submit</h1>
          <p className="text-muted-foreground mt-2">
            Submit your SaaS product to multiple directories at once
          </p>
        </div>

        {/* SaaS Product Selection */}
        <Card>
          <CardHeader>
            <CardTitle>1. Select SaaS Product</CardTitle>
            <CardDescription>
              Choose the SaaS product you want to submit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {saasProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No SaaS products found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please add a SaaS product first before submitting
                </p>
              </div>
            ) : (
              <Select onValueChange={setSelectedSaas}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a SaaS Product" />
                </SelectTrigger>
                <SelectContent>
                  {saasProducts.map((saas) => (
                    <SelectItem key={saas.id} value={saas.id.toString()}>
                      {saas.name} - {saas.website_url}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Directory Selection */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  2. Select Directories
                  {selectedDirectories.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedDirectories.length} selected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Choose which directories to submit to
                </CardDescription>
              </div>
              {directories.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                >
                  {selectedDirectories.length === directories.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {directories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">No active directories found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please add some directories before submitting
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {directories.map((directory) => (
                  <div
                    key={directory.id}
                    onClick={() => toggleDirectory(directory.id)}
                    className={`
                      flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition
                      ${
                        selectedDirectories.includes(directory.id)
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-primary/50"
                      }
                    `}
                  >
                    <Checkbox
                      checked={selectedDirectories.includes(directory.id)}
                      onCheckedChange={() => toggleDirectory(directory.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">
                        {directory.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {directory.url}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {directory.domain_authority && (
                          <Badge variant="secondary" className="text-xs">
                            DA: {directory.domain_authority}
                          </Badge>
                        )}
                        {directory.category && (
                          <Badge variant="outline" className="text-xs">
                            {directory.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleSubmit}
              disabled={
                bulkSubmitMutation.isPending ||
                !selectedSaas ||
                selectedDirectories.length === 0
              }
              className="w-full"
              size="lg"
            >
              {bulkSubmitMutation.isPending ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Submit to {selectedDirectories.length} Director
                  {selectedDirectories.length !== 1 ? "ies" : "y"}
                </>
              )}
            </Button>

            {result && (
              <div
                className={`
                  mt-4 p-4 rounded-lg border
                  ${
                    result.success
                      ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                      : "bg-destructive/10 border-destructive/20 text-white"
                  }
                `}
              >
                <p className="font-medium">{result.message}</p>
                {result.success && result.submissions && (
                  <div className="mt-2 text-sm space-y-1">
                    <p>
                      ✓{" "}
                      {
                        result.submissions.filter((s) => s.status === "submitted")
                          .length
                      }{" "}
                      successful
                    </p>
                    <p>
                      ✗{" "}
                      {
                        result.submissions.filter((s) => s.status === "failed")
                          .length
                      }{" "}
                      failed
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">About Bulk Submissions</p>
                <p className="text-muted-foreground">
                  Submissions are processed concurrently with automatic retry
                  logic. Each directory will be analyzed by AI to detect form
                  fields, then filled and submitted automatically. This process
                  may take several minutes depending on the number of directories.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BulkSubmit;
