interface Scrap {
  id: string;
  code: string;
  content: string;
  x: number;
  y: number;
  visible: boolean;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: number;
  updatedAt: number;
}

class ApiClient {
  private async request<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API Error: ${url}`, error);
      throw error;
    }
  }

  // Scrap-specific methods
  async fetchScraps(authenticated: boolean) {
    const endpoint = authenticated ? '/api/scraps' : '/api/scraps/public';
    return this.request<{ scraps: Scrap[] }>(endpoint);
  }

  async createScrap(data: { content: string; x: number; y: number }) {
    return this.request('/api/scraps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateScrap(id: string, data: Partial<Scrap>) {
    return this.request(`/api/scraps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateScrapVisibility(id: string, visible: boolean) {
    return this.request(`/api/scraps/${id}/visibility`, {
      method: 'PUT',
      body: JSON.stringify({ visible }),
    });
  }

  async checkPermission(userId: string, resource: string, action: string) {
    return this.request<{ hasPermission: boolean }>('/api/permissions/check', {
      method: 'POST',
      body: JSON.stringify({ userId, resource, action }),
    });
  }
}

export const api = new ApiClient();
export type { Scrap };