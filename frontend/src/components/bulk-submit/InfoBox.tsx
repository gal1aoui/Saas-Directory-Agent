import { AlertCircle } from "lucide-react";
import type React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const InfoBox: React.FC = () => {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">About Bulk Submissions</p>
            <p className="text-muted-foreground">
              Submissions are processed concurrently with automatic retry logic.
              Each directory will be analyzed by AI to detect form fields, then
              filled and submitted automatically. This process may take several
              minutes depending on the number of directories.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
