import { BrowserRouter } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 30000, // 30 seconds
        gcTime: 300000, // 5 minutes (formerly cacheTime)
      },
      mutations: {
        retry: 0,
      },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <div className="flex h-screen bg-gray-50">
          <Layout />
        </div>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
