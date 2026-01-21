import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import type {
  DirectoryCreate,
  DirectoryFilters,
  DirectoryUpdate,
} from "../../types/schema";
import { queryKeys } from "../queryKeys";

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
      queryClient.invalidateQueries({ queryKey: queryKeys.directories() });
    },
  });
}

export function useUpdateDirectory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DirectoryUpdate }) =>
      api.updateDirectory(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.directories() });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.directories() });
    },
  });
}
