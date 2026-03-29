import type { Activity } from "~/types/activity-types";
import type { ServerQuestionType } from "~/types/activity-props";

type NullableString = string | null;

type LegacyQuestionRecord = Partial<ServerQuestionType> & {
  _id?: string;
  option?: unknown;
  images?: unknown;
};

type ExternalQuestionRecord = {
  _id?: string;
  id?: number | string;
  text?: string | null;
  answer?: string | null;
  images?: unknown;
  option?: unknown;
  description?: Array<{ id: number; details: string }> | null;
  audioPath?: string | null;
  videoPath?: string | null;
};

type ExternalActivityRecord = {
  _id?: string;
  id?: number | string;
  title?: string | null;
  thumbnail?: string | null;
  category?: string | null;
  description?: string | null;
  topic?: string | null;
  topicId?: string | null;
  subTopic?: string | null;
  activityName?: string | null;
  activityDescription?: string | null;
  questions?: unknown;
  summary?: string | null;
  summaryPath?: string | null;
  played?: boolean | null;
  verified?: boolean | string | null;
};

type ActivityCollectionPayload =
  | ExternalActivityRecord[]
  | {
      activities?: ExternalActivityRecord[];
      items?: ExternalActivityRecord[];
      data?:
        | ExternalActivityRecord[]
        | {
            activities?: ExternalActivityRecord[];
            items?: ExternalActivityRecord[];
          };
    };

type ActivityItemPayload =
  | ExternalActivityRecord
  | {
      activity?: ExternalActivityRecord | null;
      data?:
        | ExternalActivityRecord
        | {
            activity?: ExternalActivityRecord | null;
            item?: ExternalActivityRecord | null;
          }
        | null;
      item?: ExternalActivityRecord | null;
    };

const QUESTION_TEXT_FIELD_KEYS = [
  "textOne",
  "textTwo",
  "textThree",
  "textFour",
  "textFive",
  "textSix",
  "textSeven",
  "textEight",
  "textNine",
  "textTen",
] as const;

const QUESTION_IMAGE_FIELD_KEYS = [
  "image",
  "imageTwo",
  "imageThree",
  "imageFour",
] as const;

const QUESTION_PATH_FIELD_KEYS = [
  "path",
  "pathTwo",
  "pathThree",
  "pathFour",
] as const;

const toNullableString = (value: unknown): NullableString => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
};

const normalizeDescription = (
  value: unknown,
): Array<{ id: number; details: string }> | null => {
  if (!Array.isArray(value)) return null;

  const details = value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const record = item as { id?: unknown; details?: unknown };
      const detail = toNullableString(record.details);
      if (!detail) return null;

      const id =
        typeof record.id === "number" && Number.isFinite(record.id)
          ? record.id
          : index + 1;

      return { id, details: detail };
    })
    .filter((item): item is { id: number; details: string } => item !== null);

  return details.length ? details : null;
};

const extractOptionPayload = (value: unknown): unknown => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  return trimmed;
};

const extractOptionStrings = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => toNullableString(item))
      .filter((item): item is string => item !== null);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const source = Array.isArray(record.options)
      ? record.options
      : Array.isArray(record.values)
        ? record.values
        : Array.isArray(record.items)
          ? record.items
          : null;

    if (source) {
      return source
        .map((item) => toNullableString(item))
        .filter((item): item is string => item !== null);
    }
  }

  const asText = toNullableString(value);
  return asText ? [asText] : [];
};

const isLegacyQuestionRecord = (
  value: unknown,
): value is LegacyQuestionRecord => {
  if (!value || typeof value !== "object") return false;

  return (
    "textOne" in value ||
    "textTwo" in value ||
    "textThree" in value ||
    "path" in value ||
    "pathTwo" in value
  );
};

const isActivityRecordCandidate = (
  value: unknown,
): value is ExternalActivityRecord => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  return (
    "_id" in value ||
    "id" in value ||
    "title" in value ||
    "activityName" in value ||
    "category" in value ||
    "questions" in value
  );
};

const normalizeLegacyQuestion = (
  question: LegacyQuestionRecord,
  index: number,
): ServerQuestionType => ({
  id:
    question.id ??
    (typeof question._id === "string" && question._id.trim().length
      ? question._id
      : index + 1),
  description: normalizeDescription(question.description),
  textOne: toNullableString(question.textOne),
  textTwo: toNullableString(question.textTwo),
  textThree: toNullableString(question.textThree),
  textFour: toNullableString(question.textFour),
  textFive: toNullableString(question.textFive),
  textSix: toNullableString(question.textSix),
  textSeven: toNullableString(question.textSeven),
  textEight: toNullableString(question.textEight),
  textNine: toNullableString(question.textNine),
  textTen: toNullableString(question.textTen),
  audioPath: toNullableString(question.audioPath),
  videoPath: toNullableString(question.videoPath),
  image: toNullableString(question.image),
  imageTwo: toNullableString(question.imageTwo),
  imageThree: toNullableString(question.imageThree),
  imageFour: toNullableString(question.imageFour),
  path: toNullableString(question.path),
  pathTwo: toNullableString(question.pathTwo),
  pathThree: toNullableString(question.pathThree),
  pathFour: toNullableString(question.pathFour),
});

const normalizeExternalQuestion = (
  question: ExternalQuestionRecord,
  index: number,
): ServerQuestionType => {
  const optionPayload = extractOptionPayload(question.option);
  const optionStrings = extractOptionStrings(optionPayload);
  const optionRecord =
    optionPayload && typeof optionPayload === "object" && !Array.isArray(optionPayload)
      ? (optionPayload as Record<string, unknown>)
      : null;
  const images = Array.isArray(question.images)
    ? question.images
        .map((item) => toNullableString(item))
        .filter((item): item is string => item !== null)
    : [];

  const normalized: ServerQuestionType = {
    id:
      question.id ??
      (typeof question._id === "string" && question._id.trim().length
        ? question._id
        : index + 1),
    description: normalizeDescription(question.description ?? optionRecord?.description),
    textOne: toNullableString(question.text),
    textTwo: toNullableString(question.answer),
    textThree: null,
    textFour: null,
    textFive: null,
    textSix: null,
    textSeven: null,
    textEight: null,
    textNine: null,
    textTen: null,
    audioPath: toNullableString(question.audioPath ?? optionRecord?.audioPath),
    videoPath: toNullableString(question.videoPath ?? optionRecord?.videoPath),
    image: images[0] ?? toNullableString(optionRecord?.image),
    imageTwo: images[1] ?? toNullableString(optionRecord?.imageTwo),
    imageThree: images[2] ?? toNullableString(optionRecord?.imageThree),
    imageFour: images[3] ?? toNullableString(optionRecord?.imageFour),
    path: images[0] ?? toNullableString(optionRecord?.path),
    pathTwo: images[1] ?? toNullableString(optionRecord?.pathTwo),
    pathThree: images[2] ?? toNullableString(optionRecord?.pathThree),
    pathFour: images[3] ?? toNullableString(optionRecord?.pathFour),
  };

  QUESTION_TEXT_FIELD_KEYS.forEach((key, keyIndex) => {
    const fromOptionRecord = toNullableString(optionRecord?.[key]);
    const fromOptionList = optionStrings[keyIndex];
    normalized[key] = normalized[key] ?? fromOptionRecord ?? fromOptionList ?? null;
  });

  QUESTION_IMAGE_FIELD_KEYS.forEach((key, keyIndex) => {
    normalized[key] =
      normalized[key] ??
      toNullableString(optionRecord?.[key]) ??
      images[keyIndex] ??
      null;
  });

  QUESTION_PATH_FIELD_KEYS.forEach((key, keyIndex) => {
    normalized[key] =
      normalized[key] ??
      toNullableString(optionRecord?.[key]) ??
      images[keyIndex] ??
      null;
  });

  return normalized;
};

export const activityAuthHeaders = () => {
  const token = useCookie("signInAccessToken").value;
  return token
    ? ({ Authorization: `Bearer ${token}` } as Record<string, string>)
    : undefined;
};

export const extractActivitiesFromPayload = (
  payload: ActivityCollectionPayload | null | undefined,
): ExternalActivityRecord[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  if (Array.isArray(payload.activities)) return payload.activities;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && typeof payload.data === "object") {
    if (Array.isArray(payload.data.activities)) return payload.data.activities;
    if (Array.isArray(payload.data.items)) return payload.data.items;
  }

  return [];
};

export const extractActivityFromPayload = (
  payload: ActivityItemPayload | null | undefined,
): ExternalActivityRecord | null => {
  if (!payload) return null;
  if (Array.isArray(payload)) return null;
  if ("activity" in payload && payload.activity) return payload.activity;
  if ("item" in payload && payload.item) return payload.item;
  if ("data" in payload && payload.data && !Array.isArray(payload.data)) {
    if ("activity" in payload.data && payload.data.activity) {
      return payload.data.activity;
    }
    if ("item" in payload.data && payload.data.item) {
      return payload.data.item;
    }
    return isActivityRecordCandidate(payload.data) ? payload.data : null;
  }

  return isActivityRecordCandidate(payload) ? payload : null;
};

export const normalizeActivity = (value: unknown): Activity | null => {
  if (!value || typeof value !== "object") return null;

  const raw = value as ExternalActivityRecord;
  const questionsSource = Array.isArray(raw.questions) ? raw.questions : [];
  const questions = questionsSource.map((question, index) =>
    isLegacyQuestionRecord(question)
      ? normalizeLegacyQuestion(question, index)
      : normalizeExternalQuestion(question as ExternalQuestionRecord, index),
  );

  const rawId = raw._id ?? raw.id;
  const activityId = toNullableString(rawId);
  if (!activityId) return null;

  return {
    uuid: activityId,
    id:
      typeof raw.id === "number" && Number.isFinite(raw.id)
        ? raw.id
        : activityId,
    activityId,
    activityName:
      toNullableString(raw.activityName) ??
      toNullableString(raw.title) ??
      "",
    description:
      toNullableString(raw.category) ??
      toNullableString((raw as { description?: unknown }).description) ??
      "",
    activityDescription:
      toNullableString(raw.activityDescription) ??
      toNullableString((raw as { description?: unknown }).description) ??
      "",
    topicId:
      toNullableString(raw.topicId) ??
      toNullableString(raw.topic) ??
      "",
    played: Boolean(raw.played),
    subTopic: toNullableString(raw.subTopic) ?? "",
    verified: raw.verified ?? false,
    topicUuid:
      toNullableString(raw.topic) ??
      toNullableString(raw.topicId) ??
      "",
    questions,
    summary: toNullableString(raw.summary),
    summaryPath:
      toNullableString(raw.summaryPath) ??
      toNullableString(raw.thumbnail),
    thumbnail: toNullableString(raw.thumbnail),
  };
};
