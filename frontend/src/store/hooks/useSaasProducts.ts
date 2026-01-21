import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import type {
  SaasProductCreate,
  SaasProductUpdate,
} from "../../types/schema";
import { queryKeys } from "../queryKeys";

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
