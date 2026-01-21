import type { Directory, DirectoryStatus } from "../../types/schema";

export const getStatusVariant = (
  status: DirectoryStatus,
): "success" | "warning" | "default" => {
  switch (status) {
    case "active":
      return "success";
    case "testing":
      return "warning";
    default:
      return "default";
  }
};

export const getSuccessRate = (dir: Directory): number => {
  if (dir.total_submissions === 0) return 0;
  return (dir.successful_submissions / dir.total_submissions) * 100;
};
