/**
 * Chat Retention Policy Enforcement Endpoint
 * 
 * This endpoint enforces the retention policy by deleting old sessions
 * beyond the configured limit. Should be called:
 * 1. After creating a new session
 * 2. Periodically via a scheduled job
 * 3. On user request
 */

import apiDocs from "~/utilities/apiDocs";

export default defineEventHandler(async (event) => {
  if (event.method !== "POST") {
    throw createError({
      statusCode: 405,
      message: "Method not allowed",
    });
  }

  try {
    // Get auth token from cookie or Authorization header
    const auth_token =
      getCookie(event, "signInAccessToken") ||
      event.headers.get("authorization")?.replace("Bearer ", "").trim();

    if (!auth_token) {
      throw createError({
        statusCode: 401,
        message: "No authorization token provided. Please sign in.",
      });
    }

    const body = await readBody(event);
    const { userId, maxSessions } = body;

    if (!userId) {
      throw createError({
        statusCode: 400,
        message: "User ID is required",
      });
    }

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth_token}`,
    };

    // Call external API to enforce retention
    const url = apiDocs.chat.enforceRetention;
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        userId,
        maxSessions,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw createError({
        statusCode: response.status,
        statusMessage: `HTTP error! Status: ${response.status}`,
        message: errorText,
      });
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("[Chat Retention] Error:", error);
    
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: error.message || "Failed to enforce retention policy",
    });
  }
});
