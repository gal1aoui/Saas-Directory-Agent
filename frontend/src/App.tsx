import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { Toaster } from "./components/ui/toaster";

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
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex h-screen bg-gray-50">
                    <Layout />
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
