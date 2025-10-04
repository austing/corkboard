import type {
  ScrapWithUser,
  ScrapCreateData,
  ScrapUpdateData,
  ScrapsResponse,
  PermissionCheckResponse,
  VisibilityUpdateResponse,
  PermissionCheck,
  ApiError,
  User,
  Role
} from '../types';

interface ApiRequestOptions extends RequestInit {
  timeout?: number;
}

class ApiClient {
  private readonly baseTimeout = 10000; // 10 seconds
  private async request<T>(
    url: string,
    options?: ApiRequestOptions
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
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        const apiError: ApiError = new Error(errorData.error || `HTTP ${response.status}`) as ApiError;
        apiError.statusCode = response.status;
        apiError.endpoint = url;
        apiError.method = options?.method || 'GET';
        apiError.requestData = options?.body;
        throw apiError;
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error; // Re-throw API errors as-is
      }
      // Wrap other errors
      const apiError: ApiError = new Error('Network error occurred') as ApiError;
      apiError.endpoint = url;
      apiError.method = options?.method || 'GET';
      apiError.details = { originalError: error };
      console.error(`API Error: ${url}`, apiError);
      throw apiError;
    }
  }

  // Scrap-specific methods
  async fetchScraps(): Promise<ScrapsResponse> {
    // Single endpoint handles both authenticated and unauthenticated requests
    // API will redact content based on authentication status
    return this.request<ScrapsResponse>('/api/scraps');
  }

  async createScrap(data: ScrapCreateData): Promise<ScrapWithUser> {
    return this.request<ScrapWithUser>('/api/scraps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateScrap(id: string, data: ScrapUpdateData): Promise<ScrapWithUser> {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid scrap ID provided');
    }
    return this.request<ScrapWithUser>(`/api/scraps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateScrapVisibility(id: string, visible: boolean): Promise<VisibilityUpdateResponse> {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid scrap ID provided');
    }
    if (typeof visible !== 'boolean') {
      throw new Error('Visibility must be a boolean value');
    }
    return this.request<VisibilityUpdateResponse>(`/api/scraps/${id}/visibility`, {
      method: 'PUT',
      body: JSON.stringify({ visible }),
    });
  }

  async checkPermission(data: PermissionCheck): Promise<PermissionCheckResponse> {
    const { userId, resource, action } = data;
    if (!userId || !resource || !action) {
      throw new Error('Missing required permission check parameters');
    }
    return this.request<PermissionCheckResponse>('/api/permissions/check', {
      method: 'POST',
      body: JSON.stringify({ userId, resource, action }),
    });
  }

  async fetchNestedScraps(parentId: string): Promise<{ parentScrap: ScrapWithUser; nestedScraps: ScrapWithUser[] }> {
    if (!parentId || typeof parentId !== 'string') {
      throw new Error('Invalid parent scrap ID provided');
    }
    return this.request<{ parentScrap: ScrapWithUser; nestedScraps: ScrapWithUser[] }>(`/api/scraps/${parentId}/nested`);
  }

  async fetchScrapByCode(code: string): Promise<{ scrap: ScrapWithUser }> {
    if (!code || typeof code !== 'string') {
      throw new Error('Invalid scrap code provided');
    }
    return this.request<{ scrap: ScrapWithUser }>(`/api/scraps/code/${code}`);
  }

  // User management methods
  async fetchUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/api/users');
  }

  async fetchRoles(): Promise<{ roles: Role[] }> {
    return this.request<{ roles: Role[] }>('/api/roles');
  }
}

export const api = new ApiClient();

// Re-export commonly used types
export type {
  ScrapWithUser as Scrap,
  ScrapCreateData,
  ScrapUpdateData,
  ScrapsResponse,
  PermissionCheckResponse,
  ApiError
} from '../types';