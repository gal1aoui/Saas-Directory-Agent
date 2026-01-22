import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api/ApiService";
import type {
  BulkSubmissionRequest,
  SubmissionCreate,
  SubmissionFilters,
} from "../../types/schema";
import { queryKeys } from "../queryKeys";

export function useSubmissions(filters?: SubmissionFilters) {
  return useQuery({
    queryKey: queryKeys.submissions(filters),
    queryFn: () => api.getSubmissions(filters),
    staleTime: 10000,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useBulkSubmit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkSubmissionRequest) => api.bulkSubmit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useRetrySubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.retrySubmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions() });
    },
  });
}
