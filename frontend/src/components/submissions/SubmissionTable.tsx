import { format } from "date-fns";
import { ExternalLink, RefreshCw } from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SubmissionWithDetails } from "../../types/schema";
import { StatusIcon } from "./StatusIcon";
import { getStatusVariant } from "./utils";

interface SubmissionTableProps {
  submissions: SubmissionWithDetails[];
  onViewDetails: (submission: SubmissionWithDetails) => void;
  onRetry: (id: number) => void;
  isRetrying: boolean;
}

export const SubmissionTable: React.FC<SubmissionTableProps> = ({
  submissions,
  onViewDetails,
  onRetry,
  isRetrying,
}) => {
  return (
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
            {submissions.map((submission) => (
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
                    ? format(new Date(submission.submitted_at), "MMM dd, yyyy")
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {submission.listing_url && (
                      <Button variant="ghost" size="icon" asChild>
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
                        onClick={() => onRetry(submission.id)}
                        disabled={isRetrying}
                        title="Retry submission"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`}
                        />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(submission)}
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
  );
};
