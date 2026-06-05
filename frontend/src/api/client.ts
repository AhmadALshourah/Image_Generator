import axios, { type AxiosInstance } from 'axios';

import type {
  AuthStatusResponse,
  DeleteResponse,
  EnhancePromptResponse,
  GenerateRequest,
  HealthResponse,
  ImageListResponse,
  ImageRecord,
  ListImagesParams,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  StatsResponse,
  TagListResponse,
} from '../types/api';

const TOKEN_KEY = 'image-gen-token';

export function getStoredToken(): string | null {
  return typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 120_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT (if any) to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Image generation ----------------------------------------------------

export async function generateImage(payload: GenerateRequest): Promise<ImageRecord> {
  const { data } = await apiClient.post<ImageRecord>('/generate', payload);
  return data;
}

export async function listImages(params: ListImagesParams = {}): Promise<ImageListResponse> {
  const queryParams: Record<string, string | number> = {
    limit: params.limit ?? 12,
    offset: params.offset ?? 0,
  };
  if (params.q) queryParams.q = params.q;
  if (params.size) queryParams.size = params.size;
  if (params.quality) queryParams.quality = params.quality;
  if (params.background) queryParams.background = params.background;
  if (params.tag) queryParams.tag = params.tag;

  const { data } = await apiClient.get<ImageListResponse>('/images', { params: queryParams });
  return data;
}

export async function getImage(id: number): Promise<ImageRecord> {
  const { data } = await apiClient.get<ImageRecord>(`/images/${id}`);
  return data;
}

export async function deleteImage(id: number): Promise<DeleteResponse> {
  const { data } = await apiClient.delete<DeleteResponse>(`/images/${id}`);
  return data;
}

export async function enhancePrompt(prompt: string): Promise<EnhancePromptResponse> {
  const { data } = await apiClient.post<EnhancePromptResponse>('/enhance-prompt', { prompt });
  return data;
}

// ---- Tags (#20) ----------------------------------------------------------

export async function listTags(): Promise<TagListResponse> {
  const { data } = await apiClient.get<TagListResponse>('/tags');
  return data;
}

export async function setImageTags(imageId: number, tags: string[]): Promise<ImageRecord> {
  const { data } = await apiClient.put<ImageRecord>(`/images/${imageId}/tags`, { tags });
  return data;
}

// ---- Similar prompts (#17) -----------------------------------------------

// ---- Stats (#18) ---------------------------------------------------------

export async function fetchStats(): Promise<StatsResponse> {
  const { data } = await apiClient.get<StatsResponse>('/stats');
  return data;
}

// ---- Auth (#14) ----------------------------------------------------------

export async function register(payload: RegisterRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/register', payload);
  return data;
}

export async function listLibrary(params: ListImagesParams = {}): Promise<ImageListResponse> {
  const queryParams: Record<string, string | number> = {
    limit: params.limit ?? 12,
    offset: params.offset ?? 0,
  };
  if (params.q) queryParams.q = params.q;
  if (params.size) queryParams.size = params.size;
  if (params.quality) queryParams.quality = params.quality;
  if (params.background) queryParams.background = params.background;
  if (params.tag) queryParams.tag = params.tag;

  const { data } = await apiClient.get<ImageListResponse>('/library', { params: queryParams });
  return data;
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function fetchAuthStatus(): Promise<AuthStatusResponse> {
  const { data } = await apiClient.get<AuthStatusResponse>('/auth/status');
  return data;
}

// ---- Misc ----------------------------------------------------------------

export async function checkHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/health');
  return data;
}

export default apiClient;
