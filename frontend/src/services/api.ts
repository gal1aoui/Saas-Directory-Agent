import axios, { type AxiosInstance } from "axios";
import { z } from "zod";
import {
  type BulkSubmissionRequest,
  type DashboardStats,
  DashboardStatsSchema,
  type Directory,
  type DirectoryCreate,
  type DirectoryFilters,
  DirectorySchema,
  type DirectoryUpdate,
  type SaasProduct,
  type SaasProductCreate,
  SaasProductSchema,
  type SaasProductUpdate,
  type Submission,
  type SubmissionCreate,
  type SubmissionFilters,
  SubmissionSchema,
  type SubmissionWithDetails,
  SubmissionWithDetailsSchema,
  type User,
  type UserCreate,
  type UserLogin,
  UserSchema,
} from "../types/schema";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

class ApiService {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
      withCredentials: true, // Enable sending cookies as fallback
    });

    // Load tokens from localStorage on init
    this.loadTokens();

    // Request interceptor to add access token and log requests
    this.client.interceptors.request.use(
      (config) => {
        console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
        
        // Add access token from header if available
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
          console.log("🔑 Authorization header set");
        }
        
        console.log("🍪 Outgoing cookies:", document.cookie);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried, attempt token refresh
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes("/auth/")
        ) {
          originalRequest._retry = true;

          try {
            console.log("🔄 Attempting to refresh token...");
            
            // Call refresh endpoint
            const refreshResponse = await this.client.post("/auth/refresh", {});
            console.log("✅ Token refreshed successfully");
            
            // Update stored token if returned in response
            if (refreshResponse.data.access_token) {
              this.setAccessToken(refreshResponse.data.access_token);
            }
            
            // Add new token to original request
            if (this.accessToken) {
              originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
            }
            
            // Retry the original request with the new token
            return this.client(originalRequest);
          } catch (refreshError: any) {
            console.error("❌ Token refresh failed:", refreshError?.response?.data || refreshError?.message);
            // Refresh failed, redirect to login will be handled by AuthContext
            throw {
              detail: "Session expired. Please login again.",
              status: 401,
            };
          }
        }

        if (error.response) {
          console.error("API Error:", error.response.data);
          throw {
            detail: error.response.data.detail || "An error occurred",
            status: error.response.status,
          };
        } else if (error.request) {
          console.error("Network Error:", error.request);
          throw { detail: "Network error. Please check your connection." };
        } else {
          console.error("Error:", error.message);
          throw { detail: error.message };
        }
      },
    );
  }

  // Token management
  private loadTokens(): void {
    try {
      this.accessToken = localStorage.getItem("access_token");
      if (this.accessToken) {
        console.log("📦 Tokens loaded from localStorage");
      }
    } catch (e) {
      console.warn("Failed to load tokens from localStorage", e);
    }
  }

  private setAccessToken(token: string): void {
    this.accessToken = token;
    try {
      localStorage.setItem("access_token", token);
    } catch (e) {
      console.warn("Failed to save access token to localStorage", e);
    }
  }

  private setRefreshToken(token: string): void {
    try {
      localStorage.setItem("refresh_token", token);
    } catch (e) {
      console.warn("Failed to save refresh token to localStorage", e);
    }
  }

  clearTokens(): void {
    this.accessToken = null;
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    } catch (e) {
      console.warn("Failed to clear tokens from localStorage", e);
    }
  }

  // Validation helper
  private validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data);
  }

  // Authentication API
  async register(data: UserCreate): Promise<User> {
    const response = await this.client.post<{ user: User; access_token?: string; refresh_token?: string }>("/auth/register", data);
    return this.validate(UserSchema, response.data.user);
  }

  async login(data: UserLogin): Promise<User> {
    const response = await this.client.post<{ user: User; access_token?: string; refresh_token?: string }>("/auth/login", data);
    
    // Store tokens if provided in response
    if (response.data.access_token) {
      this.setAccessToken(response.data.access_token);
    }
    if (response.data.refresh_token) {
      this.setRefreshToken(response.data.refresh_token);
    }
    
    console.log("✅ Login successful, tokens stored");
    return this.validate(UserSchema, response.data.user);
  }

  async logout(): Promise<void> {
    try {
      await this.client.post("/auth/logout");
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>("/auth/me");
    return this.validate(UserSchema, response.data);
  }

  async refreshAccessToken(): Promise<void> {
    const response = await this.client.post("/auth/refresh");
    if (response.data.access_token) {
      this.setAccessToken(response.data.access_token);
    }
  }

  // SaaS Products API
  async getSaasProducts(): Promise<SaasProduct[]> {
    const response = await this.client.get<SaasProduct[]>("/saas");
    return response.data;
  }

  async getSaasProduct(id: number): Promise<SaasProduct> {
    const response = await this.client.get<SaasProduct>(`/saas/${id}`);
    return this.validate(SaasProductSchema, response.data);
  }

  async createSaasProduct(data: SaasProductCreate): Promise<SaasProduct> {
    const response = await this.client.post<SaasProduct>("/saas", data);
    return this.validate(SaasProductSchema, response.data);
  }

  async updateSaasProduct(
    id: number,
    data: SaasProductUpdate,
  ): Promise<SaasProduct> {
    const response = await this.client.put<SaasProduct>(`/saas/${id}`, data);
    return this.validate(SaasProductSchema, response.data);
  }

  async deleteSaasProduct(id: number): Promise<void> {
    await this.client.delete(`/saas/${id}`);
  }

  // Directories API
  async getDirectories(filters?: DirectoryFilters): Promise<Directory[]> {
    const response = await this.client.get<Directory[]>("/directories", {
      params: filters?.status === "all" ? {status: undefined, skilp: filters.skip, limit: filters.limit} : filters,
    });
    return response.data;
  }

  async getDirectory(id: number): Promise<Directory> {
    const response = await this.client.get<Directory>(`/directories/${id}`);
    return this.validate(DirectorySchema, response.data);
  }

  async createDirectory(data: DirectoryCreate): Promise<Directory> {
    const response = await this.client.post<Directory>("/directories", data);
    return this.validate(DirectorySchema, response.data);
  }

  async updateDirectory(id: number, data: DirectoryUpdate): Promise<Directory> {
    const response = await this.client.put<Directory>(
      `/directories/${id}`,
      data,
    );
    return this.validate(DirectorySchema, response.data);
  }

  async deleteDirectory(id: number): Promise<void> {
    await this.client.delete(`/directories/${id}`);
  }

  // Submissions API
  async getSubmissions(
    filters?: SubmissionFilters,
  ): Promise<SubmissionWithDetails[]> {
    const response = await this.client.get<SubmissionWithDetails[]>(
      "/submissions",
      {
        params: filters?.status === "all" ? {
            status: undefined,
            saas_product_id: filters.saas_product_id,
            directory_id: filters.directory_id,
            skip: filters.skip,
            limit: filters.limit,
            search: filters.search
        } : filters
      },
    );
    console.log("data: ",response.data);
    return response.data;
  }

  async getSubmission(id: number): Promise<SubmissionWithDetails> {
    const response = await this.client.get<SubmissionWithDetails>(
      `/submissions/${id}`,
    );
    return this.validate(SubmissionWithDetailsSchema, response.data);
  }

  async createSubmission(data: SubmissionCreate): Promise<Submission> {
    const response = await this.client.post<Submission>("/submissions", data);
    console.log("create: ", this.validate(SubmissionSchema, response.data), response.data, response.status);
    return this.validate(SubmissionSchema, response.data);
  }

  async bulkSubmit(data: BulkSubmissionRequest): Promise<Submission[]> {
    const response = await this.client.post<Submission[]>(
      "/submissions/bulk",
      data,
    );
    console.log("bulk create: ", z.array(SubmissionSchema).parse(response.data), response.data, response.status);
    return z.array(SubmissionSchema).parse(response.data);
  }

  async retrySubmission(id: number): Promise<Submission> {
    const response = await this.client.post<Submission>(
      `/submissions/${id}/retry`,
    );
    return this.validate(SubmissionSchema, response.data);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response =
      await this.client.get<DashboardStats>("/submissions/stats");
    return this.validate(DashboardStatsSchema, response.data);
  }
}

export const api = new ApiService();

export default ApiService;
