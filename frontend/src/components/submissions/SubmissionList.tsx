import { RefreshCw, Search, Send } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRetrySubmission, useSubmissions } from "../../store";
import type {
  SubmissionStatus,
  SubmissionWithDetails,
} from "../../types/schema";
import { useDebounce } from "../../utils/use-debounce";
import { SubmissionDetailsModal } from "./SubmissionDetailsModal";
import { SubmissionFilters } from "./SubmissionFilters";
import { SubmissionTable } from "./SubmissionTable";

const SubmissionList: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithDetails | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const { toast } = useToast();

  const {
    data: submissions = [],
    isLoading,
    refetch,
  } = useSubmissions({
    status: statusFilter || undefined,
  });

  const retryMutation = useRetrySubmission();

  const handleRetry = async (submissionId: number) => {
    try {
      await retryMutation.mutateAsync(submissionId);
      toast({
        title: "Retry initiated",
        description: "Submission retry has been queued",
      });
    } catch (error) {
      console.error("Error retrying submission:", error);
      toast({
        title: "Error",
        description: "Failed to retry submission",
        variant: "destructive",
      });
    }
  };

  const filteredSubmissions = useMemo(() => {
    if (!debouncedSearch) return submissions;

    const searchLower = debouncedSearch.toLowerCase();
    return submissions.filter(
      (sub) =>
        sub.directory.name.toLowerCase().includes(searchLower) ||
        sub.saas_product.name.toLowerCase().includes(searchLower),
    );
  }, [submissions, debouncedSearch]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>
          <p className="text-muted-foreground mt-2">
            Track all your directory submissions
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <SubmissionFilters
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
              />

              {/* Refresh */}
              <Button
                onClick={() => refetch()}
                disabled={isLoading}
                variant="default"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">
                Loading submissions...
              </p>
            </div>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-muted p-3">
                  <Send className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    No submissions found
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery
                      ? "Try adjusting your search criteria"
                      : "Start by submitting your SaaS products to directories"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <SubmissionTable
            submissions={filteredSubmissions}
            onViewDetails={setSelectedSubmission}
            onRetry={handleRetry}
            isRetrying={retryMutation.isPending}
          />
        )}

        {/* Details Dialog */}
        <Dialog
          open={!!selectedSubmission}
          onOpenChange={(open) => !open && setSelectedSubmission(null)}
        >
          {selectedSubmission && (
            <SubmissionDetailsModal submission={selectedSubmission} />
          )}
        </Dialog>
      </div>
    </div>
  );
};

export default SubmissionList;
