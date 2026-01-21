class TokenManager {
  private accessToken: string | null = null;

  loadTokens(): void {
    try {
      this.accessToken = localStorage.getItem("access_token");
      if (this.accessToken) {
        console.log("📦 Tokens loaded from localStorage");
      }
    } catch (e) {
      console.warn("Failed to load tokens from localStorage", e);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
    try {
      localStorage.setItem("access_token", token);
    } catch (e) {
      console.warn("Failed to save access token to localStorage", e);
    }
  }

  setRefreshToken(token: string): void {
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
}

export const tokenManager = new TokenManager();
