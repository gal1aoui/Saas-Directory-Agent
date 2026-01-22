import type { AxiosInstance } from "axios";
import type {
  SaasProduct,
  SaasProductCreate,
  SaasProductUpdate,
} from "../../types/schema";
import { SaasProductSchema } from "../../types/schema";
import { validate } from "../utils";

export class SaasApi {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async getSaasProducts(): Promise<SaasProduct[]> {
    const response = await this.client.get<SaasProduct[]>("/saas");
    return response.data;
  }

  async getSaasProduct(id: number): Promise<SaasProduct> {
    const response = await this.client.get<SaasProduct>(`/saas/${id}`);
    return validate(SaasProductSchema, response.data);
  }

  async createSaasProduct(data: SaasProductCreate): Promise<SaasProduct> {
    const response = await this.client.post<SaasProduct>("/saas", data);
    return validate(SaasProductSchema, response.data);
  }

  async updateSaasProduct(
    id: number,
    data: SaasProductUpdate,
  ): Promise<SaasProduct> {
    const response = await this.client.put<SaasProduct>(`/saas/${id}`, data);
    return validate(SaasProductSchema, response.data);
  }

  async deleteSaasProduct(id: number): Promise<void> {
    await this.client.delete(`/saas/${id}`);
  }
}
