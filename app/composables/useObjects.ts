import { ref, watch, type Ref } from "vue";
import { shuffle } from "~/utilities/utils";

export type GameObject = {
  id: number;
  name: string;
  syllables?: string | null;
  imagePath?: string | null;
  category?: string | null;
  type?: string | null;
  [key: string]: unknown;
};

type UseObjectsOptions = {
  type?: string | null;
  limit?: number;
  autoFetch?: boolean;
  excludedIds?: number[];
};

type ActivityObjectsResponse = {
  objects?: GameObject[];
  error?: string | null;
};

const uniqueById = (items: GameObject[]) => {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const normalizeIds = (ids: number[] = []) =>
  ids
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

export function useObjects(options: UseObjectsOptions) {
  const objects = ref<GameObject[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const excludedIds = ref<number[]>(normalizeIds(options.excludedIds));

  const fetchForType = async (type: string, limit: number, ids: number[]) => {
    return await $fetch<ActivityObjectsResponse>("/api/activity-objects", {
      query: {
        type,
        limit,
        excludeIds: ids.join(","),
      },
    });
  };

  const fetchObjects = async (nextExcludedIds: number[] = excludedIds.value) => {
    const requestedType = String(options.type || "").trim();
    const requestedLimit = Math.max(1, Number(options.limit ?? 10));
    const normalizedExcludedIds = normalizeIds(nextExcludedIds);

    excludedIds.value = normalizedExcludedIds;

    if (!requestedType) {
      objects.value = [];
      error.value = "No object type was provided for this activity.";
      return [];
    }

    loading.value = true;
    error.value = null;

    try {
      const types = requestedType
        .split("/")
        .map((value) => value.trim())
        .filter(Boolean);

      const limitPerType = Math.max(1, Math.ceil(requestedLimit / Math.max(types.length, 1)));

      const responses = await Promise.all(
        types.map((type) => fetchForType(type, limitPerType, normalizedExcludedIds)),
      );

      const mergedObjects = uniqueById(
        responses
          .flatMap((response) => response.objects ?? [])
          .filter((item) => !normalizedExcludedIds.includes(item.id)),
      );

      objects.value = shuffle(mergedObjects).slice(0, requestedLimit);

      if (!objects.value.length) {
        error.value =
          responses.find((response) => response.error)?.error ||
          `No objects were found for type "${requestedType}".`;
      }

      return objects.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load activity objects.";
      objects.value = [];
      return [];
    } finally {
      loading.value = false;
    }
  };

  watch(
    () => [options.type, options.limit, options.autoFetch] as const,
    () => {
      if (options.autoFetch) {
        void fetchObjects(excludedIds.value);
      }
    },
    { immediate: !!options.autoFetch },
  );

  return {
    objects: objects as Ref<GameObject[]>,
    loading,
    error,
    refetch: fetchObjects,
  };
}

export default useObjects;
