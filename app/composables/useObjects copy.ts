import { useState, useEffect } from "react";

export type GameObject = {
  id: number;
  name: string;
  imagePath: string;
  category?: string;
  syllables?: string | null;
};

export type UseObjectsOptions = {
  type?: string | null;
  words?: string | number | null;
  limit?: number;
  autoFetch?: boolean;
  useStrict?: boolean;
};

export type UseObjectsResult = {
  objects: GameObject[];
  loading: boolean;
  error: string | null;
  refetch: (excludeCompletedIds?: number[]) => void;
};

export const useObjects = ({
  type,
  words,
  limit,
  autoFetch = true,
  useStrict = false,
}: UseObjectsOptions = {}): UseObjectsResult => {
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchObjects = async (excludeIds?: number[]) => {
    if (!type) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let url = `/api/public/objects?type=${encodeURIComponent(type)}`;

      // Add limit parameter if provided
      if (limit !== undefined) {
        url += `&limit=${limit}`;
      }

      // Add words parameter if provided
      if (words !== undefined && words !== null) {
        url += `&words=${encodeURIComponent(words)}`;
      }

      // Add excludeIds parameter if provided
      if (excludeIds && excludeIds.length > 0) {
        url += `&excludeIds=${excludeIds.join(",")}`;
      }

      // Add strict parameter if provided
      if (useStrict) {
        url += `&strict=true`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch objects: ${response.statusText}`);
      }

      const data = await response.json();
      setObjects(data);
    } catch (err) {
      console.error("Error fetching objects:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setObjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchObjects();
    }
  }, [type, words, limit, autoFetch, useStrict]);

  const refetch = (excludeCompletedIds?: number[]) => {
    fetchObjects(excludeCompletedIds);
  };

  return {
    objects,
    loading,
    error,
    refetch,
  };
};

// Convenience hooks for specific activities (backwards compatibility)
export const useHiddenWordsObjects = (type: string | null) => {
  return useObjects({
    type,
    words: 1,
    limit: 9,
  });
};

export const useItemsLabellingObjects = (type: string | null) => {
  return useObjects({
    type,
    limit: 9,
  });
};

export const useRearrangeLettersObjects = (
  type: string | null,
  words: string | null,
) => {
  return useObjects({
    type,
    words,
  });
};
