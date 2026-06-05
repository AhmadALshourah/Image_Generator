/**
 * Hand-written types that mirror the FastAPI Pydantic schemas.
 *
 * Authoritative source: `backend/app/schemas.py`. To regenerate from the live
 * OpenAPI spec instead of maintaining this file by hand, run:
 *
 *   npm run generate-types
 *
 * which uses `openapi-typescript` to produce `src/types/openapi.ts`.
 */

// ---------- Primitive unions ----------

export type ImageSize = '1024x1024' | '1024x1536' | '1536x1024' | 'auto';
export type ImageQuality = 'low' | 'medium' | 'high' | 'auto';
export type ImageBackground = 'transparent' | 'opaque' | 'auto';
export type ImageOutputFormat = 'png' | 'jpeg' | 'webp';

// ---------- Requests ----------

export interface GenerateRequest {
  prompt: string;
  size: ImageSize;
  quality: ImageQuality;
  background: ImageBackground;
  output_format: ImageOutputFormat;
  force: boolean;
}

export interface EnhancePromptRequest {
  prompt: string;
}

export interface ListImagesParams {
  limit?: number;
  offset?: number;
  q?: string;
  size?: string;
  quality?: string;
  background?: string;
  tag?: string;
}

// ---------- Responses ----------

export interface TagSummary {
  id: number;
  name: string;
}

export interface TagWithCount {
  id: number;
  name: string;
  image_count: number;
}

export interface TagListResponse {
  items: TagWithCount[];
}

export interface ImageRecord {
  id: number;
  uuid: string;
  prompt: string;
  effective_prompt: string;
  was_translated: boolean;
  size: string;
  quality: string;
  background: string;
  output_format: string;
  filename: string;
  thumbnail_filename: string;
  file_size: number;
  cost_usd: number;
  created_at: string;
  tags: TagSummary[];
  image_url: string;
  thumbnail_url: string;
  cached: boolean;
  is_gallery: boolean;
  owner_id: number | null;
}

export interface ImageListResponse {
  items: ImageRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface EnhancePromptResponse {
  original: string;
  enhanced: string;
  created_at: string;
}

export interface CostByDay {
  day: string;
  images: number;
  cost_usd: number;
}

export interface StatsResponse {
  total_images: number;
  total_cost_usd: number;
  cached_count: number;
  translated_count: number;
  by_quality: Record<string, number>;
  by_size: Record<string, number>;
  by_day: CostByDay[];
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface AuthStatusResponse {
  auth_enabled: boolean;
  is_authenticated: boolean;
  username: string | null;
  needs_setup: boolean;
  role: 'admin' | 'user';
}

export interface DeleteResponse {
  deleted: boolean;
  id: number;
}

export interface HealthResponse {
  status: string;
  model: string;
}

// ---------- Frontend-only ----------

export type Theme = 'light' | 'dark';

export interface GalleryFilters {
  q: string;
  size: string;
  quality: string;
  background: string;
  tag: string;
}
