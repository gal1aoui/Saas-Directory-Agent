import axios, { type AxiosInstance } from 'axios';
import {
  type SaasProduct,
  type SaasProductCreate,
  type SaasProductUpdate,
  type Directory,
  type DirectoryCreate,
  type DirectoryUpdate,
  type Submission,
  type SubmissionWithDetails,
  type SubmissionCreate,
  type BulkSubmissionRequest,
  type DashboardStats,
  type DirectoryFilters,
  type SubmissionFilters,
  SaasProductSchema,
  DirectorySchema,
  SubmissionSchema,
  SubmissionWithDetailsSchema,
  DashboardStatsSchema
} from '../types/schema';
import { z } from 'zod';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error('API Error:', error.response.data);
          throw {
            detail: error.response.data.detail || 'An error occurred',
            status: error.response.status
          };
        } else if (error.request) {
          console.error('Network Error:', error.request);
          throw { detail: 'Network error. Please check your connection.' };
        } else {
          console.error('Error:', error.message);
          throw { detail: error.message };
        }
      }
    );
  }

  // Validation helper
  private validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data);
  }

  // SaaS Products API
  async getSaasProducts(): Promise<SaasProduct[]> {
    const response = await this.client.get<SaasProduct[]>('/saas');
    return z.array(SaasProductSchema).parse(response.data);
  }

  async getSaasProduct(id: number): Promise<SaasProduct> {
    const response = await this.client.get<SaasProduct>(`/saas/${id}`);
    return this.validate(SaasProductSchema, response.data);
  }

  async createSaasProduct(data: SaasProductCreate): Promise<SaasProduct> {
    const response = await this.client.post<SaasProduct>('/saas', data);
    return this.validate(SaasProductSchema, response.data);
  }

  async updateSaasProduct(id: number, data: SaasProductUpdate): Promise<SaasProduct> {
    const response = await this.client.put<SaasProduct>(`/saas/${id}`, data);
    return this.validate(SaasProductSchema, response.data);
  }

  async deleteSaasProduct(id: number): Promise<void> {
    await this.client.delete(`/saas/${id}`);
  }

  // Directories API
  async getDirectories(filters?: DirectoryFilters): Promise<Directory[]> {
    const response = await this.client.get<Directory[]>('/directories', { params: filters });
    return z.array(DirectorySchema).parse(response.data);
  }

  async getDirectory(id: number): Promise<Directory> {
    const response = await this.client.get<Directory>(`/directories/${id}`);
    return this.validate(DirectorySchema, response.data);
  }

  async createDirectory(data: DirectoryCreate): Promise<Directory> {
    const response = await this.client.post<Directory>('/directories', data);
    return this.validate(DirectorySchema, response.data);
  }

  async updateDirectory(id: number, data: DirectoryUpdate): Promise<Directory> {
    const response = await this.client.put<Directory>(`/directories/${id}`, data);
    return this.validate(DirectorySchema, response.data);
  }

  async deleteDirectory(id: number): Promise<void> {
    await this.client.delete(`/directories/${id}`);
  }

  // Submissions API
  async getSubmissions(filters?: SubmissionFilters): Promise<SubmissionWithDetails[]> {
    const response = await this.client.get<SubmissionWithDetails[]>('/submissions', { 
      params: filters 
    });
    return z.array(SubmissionWithDetailsSchema).parse(response.data);
  }

  async getSubmission(id: number): Promise<SubmissionWithDetails> {
    const response = await this.client.get<SubmissionWithDetails>(`/submissions/${id}`);
    return this.validate(SubmissionWithDetailsSchema, response.data);
  }

  async createSubmission(data: SubmissionCreate): Promise<Submission> {
    const response = await this.client.post<Submission>('/submissions', data);
    return this.validate(SubmissionSchema, response.data);
  }

  async bulkSubmit(data: BulkSubmissionRequest): Promise<Submission[]> {
    const response = await this.client.post<Submission[]>('/submissions/bulk', data);
    return z.array(SubmissionSchema).parse(response.data);
  }

  async retrySubmission(id: number): Promise<Submission> {
    const response = await this.client.post<Submission>(`/submissions/${id}/retry`);
    return this.validate(SubmissionSchema, response.data);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.client.get<DashboardStats>('/submissions/stats');
    return this.validate(DashboardStatsSchema, response.data);
  }
}

export const api = new ApiService();

export default ApiService;