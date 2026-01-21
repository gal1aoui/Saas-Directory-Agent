import type { SubmissionStatus } from "../../types/schema";

export const getStatusVariant = (
  status: SubmissionStatus,
): "success" | "warning" | "destructive" | "info" | "default" => {
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
