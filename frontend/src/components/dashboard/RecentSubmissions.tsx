import { format } from "date-fns";
import { Database } from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SubmissionWithDetails } from "../../types/schema";
import { StatusIcon } from "./StatusIcon";
import { getStatusVariant } from "./utils";

interface RecentSubmissionsProps {
  submissions: SubmissionWithDetails[];
}

export const RecentSubmissions: React.FC<RecentSubmissionsProps> = ({
  submissions,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Submissions</CardTitle>
        <CardDescription>Latest 5 submissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {submissions.slice(0, 5).map((submission) => (
            <div
              key={submission.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <StatusIcon status={submission.status} />
                <div>
                  <p className="text-sm font-medium">
                    {submission.directory.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(submission.created_at), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
              <Badge variant={getStatusVariant(submission.status)}>
                {submission.status}
              </Badge>
            </div>
          ))}
          {submissions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mb-2" />
              <p className="text-sm">No submissions yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
