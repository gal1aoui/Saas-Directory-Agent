import type { AxiosInstance } from "axios";
import { z } from "zod";
import type {
  BulkSubmissionRequest,
  DashboardStats,
  Submission,
  SubmissionCreate,
  SubmissionFilters,
  SubmissionWithDetails,
} from "../../types/schema";
import {
  DashboardStatsSchema,
  SubmissionSchema,
  SubmissionWithDetailsSchema,
} from "../../types/schema";
import { validate } from "../utils";

export class SubmissionsApi {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async getSubmissions(
    filters?: SubmissionFilters,
  ): Promise<SubmissionWithDetails[]> {
    const response = await this.client.get<SubmissionWithDetails[]>(
      "/submissions",
      {
        params:
          filters?.status === "all"
            ? {
                status: undefined,
                saas_product_id: filters.saas_product_id,
                directory_id: filters.directory_id,
                skip: filters.skip,
                limit: filters.limit,
                search: filters.search,
              }
            : filters,
      },
    );
    console.log("data: ", response.data);
    return response.data;
  }

  async getSubmission(id: number): Promise<SubmissionWithDetails> {
    const response = await this.client.get<SubmissionWithDetails>(
      `/submissions/${id}`,
    );
    return validate(SubmissionWithDetailsSchema, response.data);
  }

  async createSubmission(data: SubmissionCreate): Promise<Submission> {
    const response = await this.client.post<Submission>("/submissions", data);
    console.log(
      "create: ",
      validate(SubmissionSchema, response.data),
      response.data,
      response.status,
    );
    return validate(SubmissionSchema, response.data);
  }

  async bulkSubmit(data: BulkSubmissionRequest): Promise<Submission[]> {
    const response = await this.client.post<Submission[]>(
      "/submissions/bulk",
      data,
    );
    console.log(
      "bulk create: ",
      z.array(SubmissionSchema).parse(response.data),
      response.data,
      response.status,
    );
    return z.array(SubmissionSchema).parse(response.data);
  }

  async retrySubmission(id: number): Promise<Submission> {
    const response = await this.client.post<Submission>(
      `/submissions/${id}/retry`,
    );
    return validate(SubmissionSchema, response.data);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response =
      await this.client.get<DashboardStats>("/submissions/stats");
    return validate(DashboardStatsSchema, response.data);
  }
}
