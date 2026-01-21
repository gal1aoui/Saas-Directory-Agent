import { format } from "date-fns";
import {
  CheckCircle,
  Clock,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { useRetrySubmission, useSubmissions } from "../store";
import type { SubmissionStatus, SubmissionWithDetails } from "../types/schema";
import { useDebounce } from "../utils/use-debounce";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const SubmissionList: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">("all");
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

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SubmissionStatus | "all")}>
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                  <h3 className="font-semibold text-lg">No submissions found</h3>
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
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Directory</TableHead>
                    <TableHead>SaaS Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {submission.directory.name}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {submission.directory.url}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {submission.saas_product.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(submission.status)}>
                          <StatusIcon status={submission.status} className="mr-1" />
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {submission.submitted_at
                          ? format(
                              new Date(submission.submitted_at),
                              "MMM dd, yyyy",
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {submission.listing_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                            >
                              <a
                                href={submission.listing_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View listing"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {submission.status === "failed" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRetry(submission.id)}
                              disabled={retryMutation.isPending}
                              title="Retry submission"
                            >
                              <RefreshCw
                                className={`h-4 w-4 ${retryMutation.isPending ? "animate-spin" : ""}`}
                              />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            View Details
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

        {/* Details Dialog */}
        <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
          {selectedSubmission && (
            <SubmissionDetailsModal submission={selectedSubmission} />
          )}
        </Dialog>
      </div>
    </div>
  );
};

interface StatusIconProps {
  status: SubmissionStatus;
  className?: string;
}

const StatusIcon: React.FC<StatusIconProps> = ({ status, className }) => {
  const iconClass = `h-3 w-3 ${className || ""}`;

  switch (status) {
    case "approved":
      return <CheckCircle className={iconClass} />;
    case "submitted":
      return <Send className={iconClass} />;
    case "pending":
      return <Clock className={iconClass} />;
    case "failed":
    case "rejected":
      return <XCircle className={iconClass} />;
    default:
      return null;
  }
};

const getStatusVariant = (
  status: SubmissionStatus
): "success" | "info" | "warning" | "destructive" | "default" => {
  switch (status) {
    case "approved":
      return "success";
    case "submitted":
      return "info";
    case "pending":
      return "warning";
    case "failed":
    case "rejected":
      return "destructive";
    default:
      return "default";
  }
};

interface SubmissionDetailsModalProps {
  submission: SubmissionWithDetails;
}

const SubmissionDetailsModal: React.FC<SubmissionDetailsModalProps> = ({
  submission,
}) => {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Submission Details</DialogTitle>
        <DialogDescription>
          View detailed information about this submission
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Directory
          </label>
          <p className="text-base font-medium mt-1">{submission.directory.name}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">
            SaaS Product
          </label>
          <p className="text-base font-medium mt-1">{submission.saas_product.name}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Status
          </label>
          <div className="mt-1">
            <Badge variant={getStatusVariant(submission.status)}>
              {submission.status}
            </Badge>
          </div>
        </div>

        {submission.response_message && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Response Message
            </label>
            <p className="text-base mt-1">{submission.response_message}</p>
          </div>
        )}

        {submission.listing_url && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Listing URL
            </label>
            <a
              href={submission.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all block mt-1"
            >
              {submission.listing_url}
            </a>
          </div>
        )}

        {submission.retry_count > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Retry Count
            </label>
            <p className="text-base mt-1">
              {submission.retry_count} / {submission.max_retries}
            </p>
          </div>
        )}

        {submission.error_log && submission.error_log.length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Error Log
            </label>
            <div className="mt-1 bg-destructive/10 rounded-md p-3 text-sm max-h-40 overflow-y-auto">
              {submission.error_log.map((error, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <span className="font-medium">
                    {format(new Date(error.timestamp), "MMM dd, yyyy HH:mm:ss")}
                  </span>:{" "}
                  {error.error}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
};

export default SubmissionList;
