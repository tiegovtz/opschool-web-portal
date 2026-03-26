import apiDocs from "~/utilities/apiDocs";

type RawRecord = Record<string, any>;

const readArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.objects)) return payload.objects;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.objects)) return payload.data.objects;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  return [];
};

const stringOrNull = (...values: any[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const numberOrNull = (...values: any[]) => {
  for (const value of values) {
    const next = Number(value);
    if (Number.isFinite(next) && next > 0) {
      return next;
    }
  }

  return null;
};

const hashString = (value: string) =>
  value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

const normalizeObject = (record: RawRecord) => {
  const name = stringOrNull(
    record.name,
    record.word,
    record.title,
    record.label,
    record.objectName,
    record.textOne,
  );

  if (!name) return null;

  const id =
    numberOrNull(record.id, record.objectId, record.itemId, record.questionId) ??
    hashString(name);

  return {
    ...record,
    id,
    name,
    syllables: stringOrNull(
      record.syllables,
      record.definition,
      record.textTwo,
      record.description,
    ),
    imagePath: stringOrNull(
      record.imagePath,
      record.image,
      record.path,
      record.pathOne,
      record.pathTwo,
    ),
    category: stringOrNull(
      record.category,
      record.objectCategory,
      record.type,
      record.objectType,
      record.textThree,
    ),
    type: stringOrNull(record.type, record.objectType, record.category),
  };
};

const buildCandidateUrls = (baseUrl: string, type: string, limit: number) => {
  const params = new URLSearchParams();
  params.set("type", type);
  params.set("limit", String(limit));

  return [
    `${baseUrl}/objects?${params.toString()}`,
    `${baseUrl}/objects/filter-all?${params.toString()}`,
    `${baseUrl}/activity-objects?${params.toString()}`,
    `${baseUrl}/game-objects?${params.toString()}`,
    `${baseUrl}/questions/objects?${params.toString()}`,
    `${baseUrl}/objects/by-type/${encodeURIComponent(type)}?limit=${limit}`,
    `${baseUrl}/activity-objects/by-type/${encodeURIComponent(type)}?limit=${limit}`,
  ];
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const type = String(query.type || "").trim();
  const limit = Math.max(1, Number(query.limit ?? 10));
  const excludeIds = String(query.excludeIds || "")
    .split(",")
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!type) {
    throw createError({
      statusCode: 400,
      message: "type query parameter is required",
    });
  }

  const authToken =
    getCookie(event, "signInAccessToken") ||
    getHeader(event, "authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const attempts: string[] = [];

  for (const url of buildCandidateUrls(apiDocs.baseURL, type, limit)) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        attempts.push(`${response.status} ${url}`);
        continue;
      }

      const payload = await response.json();
      const objects = readArray(payload)
        .map((record) => normalizeObject(record as RawRecord))
        .filter((record): record is NonNullable<typeof record> => !!record)
        .filter((record) => !excludeIds.includes(record.id))
        .slice(0, limit);

      if (objects.length) {
        return {
          objects,
          source: url,
        };
      }

      attempts.push(`empty ${url}`);
    } catch (error) {
      attempts.push(
        `${url}: ${error instanceof Error ? error.message : "Unknown request error"}`,
      );
    }
  }

  return {
    objects: [],
    error: `Unable to resolve activity objects for "${type}". Attempts: ${attempts.slice(0, 4).join(" | ")}`,
  };
});
