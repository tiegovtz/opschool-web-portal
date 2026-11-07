/**
 * Turn an AI chat failure into a specific, localized message.
 *
 * Errors arrive in two forms:
 * - a stream error written by /api/chat as "chat_error:<code>"
 * - an HTTP error body (h3 createError JSON) that the AI SDK transport puts in
 *   Error.message, carrying `data.code` (and `data.reason` for validation)
 */

type Lang = "english" | "kiswahili";

const MESSAGES: Record<string, Record<Lang, string>> = {
  quota: {
    english: "The AI service has reached its usage limit. Please try again later.",
    kiswahili: "Huduma ya AI imefikia kikomo cha matumizi. Tafadhali jaribu tena baadaye.",
  },
  rate_limit: {
    english: "You're sending messages too quickly. Please wait a minute and try again.",
    kiswahili: "Unatuma ujumbe haraka sana. Tafadhali subiri dakika moja kisha ujaribu tena.",
  },
  auth: {
    english: "Your session has expired. Please sign in again to use the AI teacher.",
    kiswahili: "Muda wako wa kuingia umeisha. Tafadhali ingia tena ili kutumia mwalimu wa AI.",
  },
  provider: {
    english: "The AI service is having a problem right now. Please try again in a few minutes.",
    kiswahili: "Huduma ya AI ina tatizo kwa sasa. Tafadhali jaribu tena baada ya dakika chache.",
  },
  validation: {
    english: "This message couldn't be processed. Try a shorter message or a different file.",
    kiswahili: "Ujumbe huu haukuweza kushughulikiwa. Jaribu ujumbe mfupi zaidi au faili jingine.",
  },
  network: {
    english: "The response didn't go through, possibly a connection issue. Try again.",
    kiswahili: "Jibu halikukamilika, huenda kwa sababu ya mtandao. Jaribu tena.",
  },
  unknown: {
    english: "Something went wrong while answering. Please try again.",
    kiswahili: "Hitilafu imetokea wakati wa kujibu. Tafadhali jaribu tena.",
  },
};

const VALIDATION_REASONS: Record<string, Record<Lang, string>> = {
  too_many_files: {
    english: "You can attach up to 3 files in a single message.",
    kiswahili: "Unaweza kuambatisha hadi faili 3 kwa ujumbe mmoja.",
  },
  unsupported_type: {
    english: "Only PDF, TXT, MD, JSON, JPG, PNG, and WEBP files are supported.",
    kiswahili: "Ni faili za PDF, TXT, MD, JSON, JPG, PNG, na WEBP pekee zinazoruhusiwa.",
  },
  image_too_large: {
    english: "Each image must be 5MB or smaller.",
    kiswahili: "Kila picha lazima iwe MB 5 au chini.",
  },
  pdf_too_large: {
    english: "Each PDF must be 10MB or smaller.",
    kiswahili: "Kila PDF lazima iwe MB 10 au chini.",
  },
  text_too_large: {
    english: "Each text document must be 1MB or smaller.",
    kiswahili: "Kila hati ya maandishi lazima iwe MB 1 au chini.",
  },
  empty_message: {
    english: "Please type a question first.",
    kiswahili: "Tafadhali andika swali kwanza.",
  },
};

export type ChatErrorKind = keyof typeof MESSAGES;

export function classifyChatClientError(error: unknown): { kind: ChatErrorKind; reason?: string } {
  const raw = String((error as any)?.message ?? error ?? "").trim();

  const streamCode = raw.match(/chat_error:([a-z_]+)/)?.[1];
  if (streamCode && MESSAGES[streamCode]) return { kind: streamCode as ChatErrorKind };

  if (raw.startsWith("{")) {
    try {
      const body = JSON.parse(raw);
      const code = body?.data?.code;
      const reason = typeof body?.data?.reason === "string" ? body.data.reason : undefined;
      if (typeof code === "string" && MESSAGES[code]) return { kind: code as ChatErrorKind, reason };
      const status = Number(body?.statusCode);
      if (status === 401 || status === 403) return { kind: "auth" };
      if (status === 429) return { kind: "rate_limit" };
      if (status === 400 || status === 413 || status === 422) return { kind: "validation" };
      if (status >= 500) return { kind: "provider" };
    } catch {
      /* not JSON */
    }
  }

  if (/failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(raw)) {
    return { kind: "network" };
  }
  return { kind: "unknown" };
}

export function describeChatError(error: unknown, isSwahili: boolean): string {
  const lang: Lang = isSwahili ? "kiswahili" : "english";
  const { kind, reason } = classifyChatClientError(error);
  if (kind === "validation" && reason && VALIDATION_REASONS[reason]) {
    return VALIDATION_REASONS[reason][lang];
  }
  return (MESSAGES[kind] ?? MESSAGES.unknown)![lang];
}

/** Retrying the same request will not help for these. */
export function isRetryableChatError(error: unknown): boolean {
  const { kind } = classifyChatClientError(error);
  return kind !== "auth" && kind !== "validation";
}
