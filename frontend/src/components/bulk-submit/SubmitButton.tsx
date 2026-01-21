import { Loader, Send } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import type { BulkSubmitResult } from "./BulkSubmit";

interface SubmitButtonProps {
  isSubmitting: boolean;
  disabled: boolean;
  selectedCount: number;
  onSubmit: () => void;
  result: BulkSubmitResult | null;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  isSubmitting,
  disabled,
  selectedCount,
  onSubmit,
  result,
}) => {
  return (
    <>
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || disabled}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader className="h-5 w-5 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-5 w-5 mr-2" />
            Submit to {selectedCount} Director
            {selectedCount !== 1 ? "ies" : "y"}
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
    </>
  );
};
