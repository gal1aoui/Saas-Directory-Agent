import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api/ApiService";
import { queryKeys } from "../queryKeys";

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: () => api.getDashboardStats(),
    staleTime: 30000,
  });
}
