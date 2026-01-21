import { z } from "zod";

// Enums
export const SubmissionStatusEnum = z.enum([
  "pending",
  "submitted",
  "approved",
  "rejected",
  "failed",
  "all",
]);

export const DirectoryStatusEnum = z.enum([
  "active",
  "inactive",
  "testing",
  "all",
]);

export type SubmissionStatus = z.infer<typeof SubmissionStatusEnum>;
export type DirectoryStatus = z.infer<typeof DirectoryStatusEnum>;
