import { format } from "date-fns";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SubmissionWithDetails } from "../../types/schema";
import { getStatusVariant } from "./utils";
import { Label } from "../ui/label";

interface SubmissionDetailsModalProps {
  submission: SubmissionWithDetails;
}

export const SubmissionDetailsModal: React.FC<SubmissionDetailsModalProps> = ({
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
          <Label className="text-sm font-medium text-muted-foreground">
            Directory
          </Label>
          <p className="text-base font-medium mt-1">
            {submission.directory.name}
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium text-muted-foreground">
            SaaS Product
          </Label>
          <p className="text-base font-medium mt-1">
            {submission.saas_product.name}
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium text-muted-foreground">
            Status
          </Label>
          <div className="mt-1">
            <Badge variant={getStatusVariant(submission.status)}>
              {submission.status}
            </Badge>
          </div>
        </div>

        {submission.response_message && (
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Response Message
            </Label>
            <p className="text-base mt-1">{submission.response_message}</p>
          </div>
        )}

        {submission.listing_url && (
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Listing URL
            </Label>
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
            <Label className="text-sm font-medium text-muted-foreground">
              Retry Count
            </Label>
            <p className="text-base mt-1">
              {submission.retry_count} / {submission.max_retries}
            </p>
          </div>
        )}

        {submission.error_log && submission.error_log.length > 0 && (
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Error Log
            </Label>
            <div className="mt-1 bg-destructive/10 rounded-md p-3 text-sm max-h-40 overflow-y-auto">
              {submission.error_log.map((error, i) => (
                <div key={`error-${error.error}-${i}`} className="mb-2 last:mb-0">
                  <span className="font-medium">
                    {format(new Date(error.timestamp), "MMM dd, yyyy HH:mm:ss")}
                  </span>
                  : {error.error}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
};
