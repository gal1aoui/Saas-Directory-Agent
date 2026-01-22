import type { AxiosInstance } from "axios";
import { AuthApi } from "./authApi";
import { createApiClient } from "./config";
import { DirectoriesApi } from "./directoriesApi";
import { SaasApi } from "./saasApi";
import { SubmissionsApi } from "./submissionsApi";
import { tokenManager } from "./tokenManager";

class ApiService {
  private client: AxiosInstance;
  private authApi: AuthApi;
  private saasApi: SaasApi;
  private directoriesApi: DirectoriesApi;
  private submissionsApi: SubmissionsApi;

  constructor() {
    this.client = createApiClient();
    this.authApi = new AuthApi(this.client);
    this.saasApi = new SaasApi(this.client);
    this.directoriesApi = new DirectoriesApi(this.client);
    this.submissionsApi = new SubmissionsApi(this.client);
  }

  // Token management - delegated to tokenManager
  clearTokens(): void {
    tokenManager.clearTokens();
  }

  // Authentication API
  register(...args: Parameters<AuthApi["register"]>) {
    return this.authApi.register(...args);
  }
  login(...args: Parameters<AuthApi["login"]>) {
    return this.authApi.login(...args);
  }
  logout(...args: Parameters<AuthApi["logout"]>) {
    return this.authApi.logout(...args);
  }
  getCurrentUser(...args: Parameters<AuthApi["getCurrentUser"]>) {
    return this.authApi.getCurrentUser(...args);
  }
  refreshAccessToken(...args: Parameters<AuthApi["refreshAccessToken"]>) {
    return this.authApi.refreshAccessToken(...args);
  }

  // SaaS Products API
  getSaasProducts(...args: Parameters<SaasApi["getSaasProducts"]>) {
    return this.saasApi.getSaasProducts(...args);
  }
  getSaasProduct(...args: Parameters<SaasApi["getSaasProduct"]>) {
    return this.saasApi.getSaasProduct(...args);
  }
  createSaasProduct(...args: Parameters<SaasApi["createSaasProduct"]>) {
    return this.saasApi.createSaasProduct(...args);
  }
  updateSaasProduct(...args: Parameters<SaasApi["updateSaasProduct"]>) {
    return this.saasApi.updateSaasProduct(...args);
  }
  deleteSaasProduct(...args: Parameters<SaasApi["deleteSaasProduct"]>) {
    return this.saasApi.deleteSaasProduct(...args);
  }

  // Directories API
  getDirectories(...args: Parameters<DirectoriesApi["getDirectories"]>) {
    return this.directoriesApi.getDirectories(...args);
  }
  getDirectory(...args: Parameters<DirectoriesApi["getDirectory"]>) {
    return this.directoriesApi.getDirectory(...args);
  }
  createDirectory(...args: Parameters<DirectoriesApi["createDirectory"]>) {
    return this.directoriesApi.createDirectory(...args);
  }
  updateDirectory(...args: Parameters<DirectoriesApi["updateDirectory"]>) {
    return this.directoriesApi.updateDirectory(...args);
  }
  deleteDirectory(...args: Parameters<DirectoriesApi["deleteDirectory"]>) {
    return this.directoriesApi.deleteDirectory(...args);
  }
  getDirectoryCredentials(...args: Parameters<DirectoriesApi["getDirectoryCredentials"]>) {
    return this.directoriesApi.getDirectoryCredentials(...args);
  }

  // Submissions API
  getSubmissions(...args: Parameters<SubmissionsApi["getSubmissions"]>) {
    return this.submissionsApi.getSubmissions(...args);
  }
  getSubmission(...args: Parameters<SubmissionsApi["getSubmission"]>) {
    return this.submissionsApi.getSubmission(...args);
  }
  createSubmission(...args: Parameters<SubmissionsApi["createSubmission"]>) {
    return this.submissionsApi.createSubmission(...args);
  }
  bulkSubmit(...args: Parameters<SubmissionsApi["bulkSubmit"]>) {
    return this.submissionsApi.bulkSubmit(...args);
  }
  retrySubmission(...args: Parameters<SubmissionsApi["retrySubmission"]>) {
    return this.submissionsApi.retrySubmission(...args);
  }
  getDashboardStats(...args: Parameters<SubmissionsApi["getDashboardStats"]>) {
    return this.submissionsApi.getDashboardStats(...args);
  }
}

export const api = new ApiService();

export default ApiService;
