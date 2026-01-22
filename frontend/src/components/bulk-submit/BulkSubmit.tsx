import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useBulkSubmit, useDirectories, useSaasProducts } from "../../store";
import type { Submission } from "../../types/schema";
import { DirectorySelection } from "./DirectorySelection";
import { InfoBox } from "./InfoBox";
import { SaasProductSelection } from "./SaasProductSelection";
import { SubmitButton } from "./SubmitButton";

export interface BulkSubmitResult {
  success: boolean;
  message: string;
  submissions?: Submission[];
}

export default function BulkSubmit() {
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
    } catch (error: unknown) {
      const errorMessage =
        (error as { detail?: string }).detail || "Something went wrong";
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

        <SaasProductSelection
          saasProducts={saasProducts}
          selectedSaas={selectedSaas}
          onSelectSaas={setSelectedSaas}
        />

        <DirectorySelection
          directories={directories}
          selectedDirectories={selectedDirectories}
          onToggleDirectory={toggleDirectory}
          onSelectAll={selectAll}
        />

        <Card>
          <CardContent className="pt-6">
            <SubmitButton
              isSubmitting={bulkSubmitMutation.isPending}
              disabled={!selectedSaas || selectedDirectories.length === 0}
              selectedCount={selectedDirectories.length}
              onSubmit={handleSubmit}
              result={result}
            />
          </CardContent>
        </Card>

        <InfoBox />
      </div>
    </div>
  );
};
