import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type {
  BulkSubmissionRequest,
  DirectoryCreate,
  DirectoryFilters,
  DirectoryUpdate,
  SaasProductCreate,
  SaasProductUpdate,
  SubmissionCreate,
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

export function useSaasProducts() {
  return useQuery({
    queryKey: queryKeys.saasProducts,
    queryFn: () => api.getSaasProducts(),
    staleTime: 30000, // 30 seconds
  });
}

export function useSaasProduct(id: number | null) {
  return useQuery({
    queryKey: id ? queryKeys.saasProduct(id) : ["saas-products-null"],
    queryFn: () => (id ? api.getSaasProduct(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useCreateSaasProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaasProductCreate) => api.createSaasProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.saasProducts });
    },
  });
}

export function useUpdateSaasProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SaasProductUpdate }) =>
      api.updateSaasProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.saasProducts });
      queryClient.invalidateQueries({
        queryKey: queryKeys.saasProduct(variables.id),
      });
    },
  });
}

export function useDeleteSaasProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteSaasProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.saasProducts });
    },
  });
}

export function useDirectories(filters?: DirectoryFilters) {
  return useQuery({
    queryKey: queryKeys.directories(filters),
    queryFn: () => api.getDirectories(filters),
    staleTime: 30000,
  });
}

export function useDirectory(id: number | null) {
  return useQuery({
    queryKey: id ? queryKeys.directory(id) : ["directories-null"],
    queryFn: () => (id ? api.getDirectory(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useCreateDirectory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DirectoryCreate) => api.createDirectory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directories"] });
    },
  });
}

export function useUpdateDirectory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DirectoryUpdate }) =>
      api.updateDirectory(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["directories"] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.directory(variables.id),
      });
    },
  });
}

export function useDeleteDirectory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteDirectory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directories"] });
    },
  });
}

export function useSubmissions(filters?: SubmissionFilters) {
  return useQuery({
    queryKey: queryKeys.submissions(filters),
    queryFn: () => api.getSubmissions(filters),
    staleTime: 10000, // 10 seconds (more frequent updates)
    refetchInterval: 30000, // Auto-refetch every 30 seconds
  });
}

export function useSubmission(id: number | null) {
  return useQuery({
    queryKey: id ? queryKeys.submission(id) : ["submissions-null"],
    queryFn: () => (id ? api.getSubmission(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmissionCreate) => api.createSubmission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useBulkSubmit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkSubmissionRequest) => api.bulkSubmit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useRetrySubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.retrySubmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: () => api.getDashboardStats(),
    staleTime: 10000,
    refetchInterval: 30000, // Auto-refetch every 30 seconds
  });
}
