import type { AxiosInstance } from "axios";
import type {
  Directory,
  DirectoryCreate,
  DirectoryFilters,
  DirectoryUpdate,
} from "../../types/schema";
import { DirectorySchema } from "../../types/schema";
import { validate } from "../utils";

export class DirectoriesApi {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async getDirectories(filters?: DirectoryFilters): Promise<Directory[]> {
    const response = await this.client.get<Directory[]>("/directories", {
      params:
        filters?.status === "all"
          ? { status: undefined, skilp: filters.skip, limit: filters.limit }
          : filters,
    });
    return response.data;
  }

  async getDirectory(id: number): Promise<Directory> {
    const response = await this.client.get<Directory>(`/directories/${id}`);
    return validate(DirectorySchema, response.data);
  }

  async createDirectory(data: DirectoryCreate): Promise<Directory> {
    const response = await this.client.post<Directory>("/directories", data);
    return validate(DirectorySchema, response.data);
  }

  async updateDirectory(id: number, data: DirectoryUpdate): Promise<Directory> {
    const response = await this.client.put<Directory>(
      `/directories/${id}`,
      data,
    );
    return validate(DirectorySchema, response.data);
  }

  async deleteDirectory(id: number): Promise<void> {
    await this.client.delete(`/directories/${id}`);
  }
}
