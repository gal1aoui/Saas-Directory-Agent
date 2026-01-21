import type {
  DirectoryFilters,
  SubmissionFilters,
} from "../types/schema";

export const queryKeys = {
  saasProducts: ["saas-products"] as const,
  saasProduct: (id: number) => ["saas-products", id] as const,
  directories: (filters?: DirectoryFilters) =>
    ["directories", filters] as const,
  directory: (id: number) => ["directories", id] as const,
  submissions: (filters?: SubmissionFilters) =>
    ["submissions", filters] as const,
  submission: (id: number) => ["submissions", id] as const,
  dashboardStats: ["dashboard-stats"] as const,
};
