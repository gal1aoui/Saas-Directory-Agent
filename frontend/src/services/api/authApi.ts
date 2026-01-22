import type { AxiosInstance } from "axios";
import type { User, UserCreate, UserLogin } from "../../types/schema";
import { UserSchema } from "../../types/schema";
import { tokenManager } from "./tokenManager";
import { validate } from "../utils";

export class AuthApi {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async register(data: UserCreate): Promise<User> {
    const response = await this.client.post<{
      user: User;
      access_token?: string;
      refresh_token?: string;
    }>("/auth/register", data);
    return validate(UserSchema, response.data.user);
  }

  async login(data: UserLogin): Promise<User> {
    const response = await this.client.post<{
      user: User;
      access_token?: string;
      refresh_token?: string;
    }>("/auth/login", data);

    // Store tokens if provided in response
    if (response.data.access_token) {
      tokenManager.setAccessToken(response.data.access_token);
    }
    if (response.data.refresh_token) {
      tokenManager.setRefreshToken(response.data.refresh_token);
    }

    console.log("✅ Login successful, tokens stored");
    return validate(UserSchema, response.data.user);
  }

  async logout(): Promise<void> {
    try {
      await this.client.post("/auth/logout");
    } finally {
      tokenManager.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>("/auth/me");
    return validate(UserSchema, response.data);
  }

  async refreshAccessToken(): Promise<void> {
    const response = await this.client.post("/auth/refresh");
    if (response.data.access_token) {
      tokenManager.setAccessToken(response.data.access_token);
    }
  }
}
