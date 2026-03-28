import type { H3Event } from "h3";
import apiDocs from "~/utilities/apiDocs";

type ProxyJsonOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

export const getLearnerProgressAuthToken = (event: H3Event) => {
  const authToken = getCookie(event, "signInAccessToken");

  if (!authToken) {
    throw createError({
      statusCode: 401,
      message: "No authorization token provided. Please sign in.",
    });
  }

  return authToken;
};

export const buildLearnerProgressUrl = (
  baseUrl: string,
  query?: Record<string, string | string[] | undefined>,
) => {
  if (!query) return baseUrl;

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      value
        .filter((entry) => typeof entry === "string" && entry.trim().length > 0)
        .forEach((entry) => search.append(key, entry));
      continue;
    }

    if (typeof value === "string" && value.trim().length > 0) {
      search.set(key, value);
    }
  }

  const queryString = search.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export const proxyLearnerProgressJson = async <T>(
  event: H3Event,
  url: string,
  options: ProxyJsonOptions = {},
): Promise<T> => {
  const authToken = getLearnerProgressAuthToken(event);
  const response = await fetch(buildLearnerProgressUrl(url, options.query), {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const message =
      (await response.text().catch(() => "")) || response.statusText;

    throw createError({
      statusCode: response.status,
      message,
    });
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
};

export { apiDocs };
