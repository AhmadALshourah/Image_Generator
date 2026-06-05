import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  deleteImage,
  enhancePrompt,
  fetchAuthStatus,
  fetchSimilarPrompts,
  fetchStats,
  generateImage,
  getImage,
  listImages,
  listLibrary,
  listTags,
  setImageTags,
} from './client';
import type {
  AuthStatusResponse,
  DeleteResponse,
  EnhancePromptResponse,
  GenerateRequest,
  ImageListResponse,
  ImageRecord,
  ListImagesParams,
  SimilarPromptsResponse,
  StatsResponse,
  TagListResponse,
} from '../types/api';

export const queryKeys = {
  images: {
    all: ['images'] as const,
    list: (params: ListImagesParams) => ['images', 'list', params] as const,
    detail: (id: number) => ['images', 'detail', id] as const,
  },
  library: {
    all: ['library'] as const,
    list: (params: ListImagesParams) => ['library', 'list', params] as const,
  },
  tags: {
    all: ['tags'] as const,
  },
  stats: {
    all: ['stats'] as const,
  },
  similar: {
    forQuery: (q: string) => ['similar', q] as const,
  },
  auth: {
    status: ['auth', 'status'] as const,
  },
};

// ---------- Image queries ----------

export function useImagesQuery(
  params: ListImagesParams
): UseQueryResult<ImageListResponse, Error> {
  return useQuery({
    queryKey: queryKeys.images.list(params),
    queryFn: () => listImages(params),
    placeholderData: keepPreviousData,
  });
}

export function useImageQuery(id: number | null): UseQueryResult<ImageRecord, Error> {
  return useQuery({
    queryKey: queryKeys.images.detail(id ?? -1),
    queryFn: () => getImage(id as number),
    enabled: id != null,
  });
}

export function useLibraryQuery(
  params: ListImagesParams
): UseQueryResult<ImageListResponse, Error> {
  return useQuery({
    queryKey: queryKeys.library.list(params),
    queryFn: () => listLibrary(params),
    placeholderData: keepPreviousData,
  });
}

// ---------- Image mutations ----------

export function useGenerateImage(): UseMutationResult<ImageRecord, Error, GenerateRequest> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: generateImage,
    onSuccess: (data) => {
      if (!data.cached) {
        qc.invalidateQueries({ queryKey: queryKeys.images.all });
        qc.invalidateQueries({ queryKey: queryKeys.stats.all });
        qc.invalidateQueries({ queryKey: queryKeys.tags.all });
      }
    },
  });
}

interface DeleteContext {
  previous: Array<readonly [readonly unknown[], unknown]>;
}

export function useDeleteImage(): UseMutationResult<DeleteResponse, Error, number, DeleteContext> {
  const qc = useQueryClient();
  return useMutation<DeleteResponse, Error, number, DeleteContext>({
    mutationFn: deleteImage,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.images.all });
      const previous = qc.getQueriesData({ queryKey: queryKeys.images.all });
      qc.setQueriesData(
        { queryKey: queryKeys.images.all },
        (old: ImageListResponse | undefined) => {
          if (!old || !Array.isArray(old.items)) return old;
          return {
            ...old,
            items: old.items.filter((img) => img.id !== id),
            total: Math.max(0, (old.total ?? 0) - 1),
          };
        }
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.images.all });
      qc.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}

export function useEnhancePrompt(): UseMutationResult<EnhancePromptResponse, Error, string> {
  return useMutation({ mutationFn: enhancePrompt });
}

// ---------- Tags ----------

export function useTagsQuery(): UseQueryResult<TagListResponse, Error> {
  return useQuery({
    queryKey: queryKeys.tags.all,
    queryFn: listTags,
  });
}

export function useSetImageTags(): UseMutationResult<
  ImageRecord,
  Error,
  { imageId: number; tags: string[] }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ imageId, tags }) => setImageTags(imageId, tags),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.images.all });
      qc.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
  });
}

// ---------- Similar prompts ----------

export function useSimilarPrompts(q: string): UseQueryResult<SimilarPromptsResponse, Error> {
  return useQuery({
    queryKey: queryKeys.similar.forQuery(q),
    queryFn: () => fetchSimilarPrompts(q),
    enabled: q.trim().length >= 4, // don't spam the API on every keystroke
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

// ---------- Stats ----------

export function useStatsQuery(): UseQueryResult<StatsResponse, Error> {
  return useQuery({
    queryKey: queryKeys.stats.all,
    queryFn: fetchStats,
    staleTime: 60_000,
  });
}

// ---------- Auth ----------

export function useAuthStatus(): UseQueryResult<AuthStatusResponse, Error> {
  return useQuery({
    queryKey: queryKeys.auth.status,
    queryFn: fetchAuthStatus,
    staleTime: 5 * 60_000,       // auth config changes only on redeploy; re-validate every 5 min
    refetchOnWindowFocus: false, // don't hit /api/auth/status on every tab switch
    retry: false,                // if the endpoint is down treat as "auth disabled", don't retry
  });
}
