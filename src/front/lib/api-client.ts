import axios, { AxiosInstance } from 'axios';

// 型定義
export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    user_id: string;
    tenant_id: string;
    roles: Array<{
      service_id: string;
      service_name: string;
      role_code: string;
      role_name: string;
    }>;
  };
}

export interface UserData {
  user_id: string;
  email?: string;
  name?: string;
  tenant_id?: string;
  is_active?: boolean;
  password?: string;
}

export interface TenantData {
  tenant_name: string;
  display_name?: string;
  description?: string;
  is_active?: boolean;
}

export interface ServiceSettings {
  [key: string]: unknown;
}

class APIClient {
  private authClient: AxiosInstance;
  private tenantClient: AxiosInstance;
  private serviceClient: AxiosInstance;

  constructor() {
    this.authClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL,
      timeout: 10000,
    });

    this.tenantClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_TENANT_SERVICE_URL,
      timeout: 10000,
    });

    this.serviceClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_SERVICE_SETTING_URL,
      timeout: 10000,
    });
  }

  // 認証サービス
  async login(userId: string, password: string) {
    const response = await this.authClient.post('/api/v1/auth/login', {
      user_id: userId,
      password,
    });
    return response.data;
  }

  async verifyToken(token: string) {
    const response = await this.authClient.post('/api/v1/auth/verify', {
      token,
    });
    return response.data;
  }

  // ユーザー管理
  async getUsers(token: string) {
    const response = await this.authClient.get('/api/v1/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async getUser(userId: string, token: string) {
    const response = await this.authClient.get(`/api/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async createUser(userData: UserData, token: string) {
    const response = await this.authClient.post('/api/v1/users', userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async updateUser(userId: string, userData: Partial<UserData>, token: string) {
    const response = await this.authClient.put(`/api/v1/users/${userId}`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async deleteUser(userId: string, token: string) {
    const response = await this.authClient.delete(`/api/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  // テナントサービス
  async getTenants(token: string) {
    const response = await this.tenantClient.get('/api/v1/tenants', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async getTenant(tenantId: string, token: string) {
    const response = await this.tenantClient.get(`/api/v1/tenants/${tenantId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async createTenant(tenantData: TenantData, token: string) {
    const response = await this.tenantClient.post('/api/v1/tenants', tenantData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async updateTenant(tenantId: string, tenantData: Partial<TenantData>, token: string) {
    const response = await this.tenantClient.put(`/api/v1/tenants/${tenantId}`, tenantData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async deleteTenant(tenantId: string, token: string) {
    const response = await this.tenantClient.delete(`/api/v1/tenants/${tenantId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  // サービス設定サービス
  async getServices(token: string) {
    const response = await this.serviceClient.get('/api/v1/services', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async getService(serviceId: string, token: string) {
    const response = await this.serviceClient.get(`/api/v1/services/${serviceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async getTenantServices(tenantId: string, token: string) {
    const response = await this.serviceClient.get(`/api/v1/tenants/${tenantId}/services`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async enableService(tenantId: string, serviceId: string, token: string) {
    const response = await this.serviceClient.post(
      `/api/v1/tenants/${tenantId}/services/${serviceId}/enable`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  }

  async disableService(tenantId: string, serviceId: string, token: string) {
    const response = await this.serviceClient.post(
      `/api/v1/tenants/${tenantId}/services/${serviceId}/disable`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  }

  async updateServiceSettings(tenantId: string, serviceId: string, settings: ServiceSettings, token: string) {
    const response = await this.serviceClient.put(
      `/api/v1/tenants/${tenantId}/services/${serviceId}/settings`,
      settings,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  }
}

export const apiClient = new APIClient();
