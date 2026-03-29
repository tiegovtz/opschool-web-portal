import { readFile } from "fs/promises";
import { join } from "path";

type ActivityJsonRecord = {
  id: number;
  activity_name?: string | null;
  topic_id?: number | string | null;
  played?: boolean | null;
  description: string;
  verified?: boolean | string | null;
  activity_description?: string | null;
  sub_topic?: string | null;
  summary?: string | null;
  summary_path?: string | null;
  summary_image?: string | null;
  approval_status?: string | null;
  is_public?: boolean | null;
  is_premium?: boolean | null;
};

type TopicJsonRecord = {
  id: number;
  topic_name?: string | null;
  grade_subject_id?: number | string | null;
  description?: string | null;
  display_order?: number | null;
};

type QuestionJsonRecord = {
  id: number;
  description?: Array<{ id: number; details: string }> | null;
  text_one?: string | null;
  text_two?: string | null;
  text_three?: string | null;
  text_four?: string | null;
  text_five?: string | null;
  text_six?: string | null;
  text_seven?: string | null;
  text_eight?: string | null;
  text_nine?: string | null;
  text_ten?: string | null;
  audio_path?: string | null;
  video_path?: string | null;
  image?: string | null;
  image_two?: string | null;
  image_three?: string | null;
  image_four?: string | null;
  path?: string | null;
  path_two?: string | null;
  path_three?: string | null;
  path_four?: string | null;
  activity_id?: number | string | null;
};

type PrimaryQuestion = {
  id: number;
  description: Array<{ id: number; details: string }> | null;
  textOne: string | null;
  textTwo: string | null;
  textThree: string | null;
  textFour: string | null;
  textFive: string | null;
  textSix: string | null;
  textSeven: string | null;
  textEight: string | null;
  textNine: string | null;
  textTen: string | null;
  audioPath: string | null;
  videoPath: string | null;
  image: string | null;
  imageTwo: string | null;
  imageThree: string | null;
  imageFour: string | null;
  path: string | null;
  pathTwo: string | null;
  pathThree: string | null;
  pathFour: string | null;
  activityId: number | string | null;
};

export type PrimaryActivity = {
  id: number;
  activityName: string;
  topicId: number | string | null;
  played: boolean;
  description: string;
  verified: boolean;
  activityDescription: string;
  subTopic: string;
  summary: string | null;
  summaryPath: string | null;
  summaryImage: string | null;
  approvalStatus: string | null;
  isPublic: boolean | null;
  isPremium: boolean | null;
  questions?: PrimaryQuestion[];
};

export type PrimaryTopic = {
  id: number;
  topicName: string;
  gradeSubjectId: number | string | null;
  description: string | null;
  displayOrder: number | null;
};

let activitiesCache: PrimaryActivity[] | null = null;
let topicsCache: PrimaryTopic[] | null = null;
let activityTypesCache: string[] | null = null;
let questionsByActivityCache: Map<string, PrimaryQuestion[]> | null = null;

const readJsonFile = async <T>(fileName: string): Promise<T> => {
  const filePath = join(process.cwd(), "public", "data", fileName);
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
};

const getActivityTypes = async (): Promise<string[]> => {
  if (activityTypesCache) return activityTypesCache;

  const filePath = join(process.cwd(), "app", "types", "activity-types.ts");
  const raw = await readFile(filePath, "utf-8");
  const enumBlock = raw.match(/export enum ActivityType\s*{([\s\S]*?)^}/m)?.[1] ?? "";
  const activityTypes = [...enumBlock.matchAll(/=\s*"([^"]+)"/g)].map((match) => match[1]?.trim());

  activityTypesCache = activityTypes as string[];
  return activityTypesCache;
};

const normalizeActivity = (item: ActivityJsonRecord): PrimaryActivity => ({
  id: Number(item.id),
  activityName: item.activity_name?.trim() || "",
  topicId: item.topic_id ?? null,
  played: Boolean(item.played),
  description: item.description?.trim() || "",
  verified: item.verified === true || item.verified === "true",
  activityDescription: item.activity_description?.trim() || "",
  subTopic: item.sub_topic?.trim() || "",
  summary: item.summary ?? null,
  summaryPath: item.summary_path ?? null,
  summaryImage: item.summary_image ?? null,
  approvalStatus: item.approval_status ?? null,
  isPublic: item.is_public ?? null,
  isPremium: item.is_premium ?? null,
});

const normalizeTopic = (item: TopicJsonRecord): PrimaryTopic => ({
  id: Number(item.id),
  topicName: item.topic_name?.trim() || "",
  gradeSubjectId: item.grade_subject_id ?? null,
  description: item.description ?? null,
  displayOrder: item.display_order ?? null,
});

const normalizeQuestion = (item: QuestionJsonRecord): PrimaryQuestion => ({
  id: Number(item.id),
  description: item.description ?? null,
  textOne: item.text_one ?? null,
  textTwo: item.text_two ?? null,
  textThree: item.text_three ?? null,
  textFour: item.text_four ?? null,
  textFive: item.text_five ?? null,
  textSix: item.text_six ?? null,
  textSeven: item.text_seven ?? null,
  textEight: item.text_eight ?? null,
  textNine: item.text_nine ?? null,
  textTen: item.text_ten ?? null,
  audioPath: item.audio_path ?? null,
  videoPath: item.video_path ?? null,
  image: item.image ?? null,
  imageTwo: item.image_two ?? null,
  imageThree: item.image_three ?? null,
  imageFour: item.image_four ?? null,
  path: item.path ?? null,
  pathTwo: item.path_two ?? null,
  pathThree: item.path_three ?? null,
  pathFour: item.path_four ?? null,
  activityId: item.activity_id ?? null,
});

const getQuestionsByActivity = async (): Promise<Map<string, PrimaryQuestion[]>> => {
  if (questionsByActivityCache) return questionsByActivityCache;

  const data = await readJsonFile<{ question?: QuestionJsonRecord[] }>("question.json");
  const questions = Array.isArray(data.question) ? data.question.map(normalizeQuestion) : [];
  const byActivity = new Map<string, PrimaryQuestion[]>();

  for (const question of questions) {
    const key = String(question.activityId ?? "").trim();
    if (!key) continue;
    const existing = byActivity.get(key) ?? [];
    existing.push(question);
    byActivity.set(key, existing);
  }

  questionsByActivityCache = byActivity;
  return questionsByActivityCache;
};

export const getPrimaryActivities = async (): Promise<PrimaryActivity[]> => {
  if (activitiesCache) return activitiesCache;

  const data = await readJsonFile<{ activity?: ActivityJsonRecord[] }>("activity.json");
  activitiesCache = Array.isArray(data.activity) ? data.activity.map(normalizeActivity) : [];
  return activitiesCache;
};

export const getPrimaryActivityById = async (
  id: number | string,
): Promise<PrimaryActivity | null> => {
  const normalizedId = Number(id);
  if (!Number.isFinite(normalizedId)) return null;

  const activities = await getPrimaryActivities();
  const activity = activities.find((item) => item.id === normalizedId);
  if (!activity) return null;

  const questionsByActivity = await getQuestionsByActivity();

  return {
    ...activity,
    questions: questionsByActivity.get(String(normalizedId)) ?? [],
  };
};

export const getPrimaryActivityIds = async (): Promise<number[]> => {
  const activities = await getPrimaryActivities();
  return activities.map((item) => item.id);
};

export type PrimaryActivityPerType = {
  type: string;
  activity: PrimaryActivity | null;
};

export const getPrimaryActivityOnePerType = async (): Promise<PrimaryActivityPerType[]> => {
  const activities = await getPrimaryActivities();
  const activityTypes = await getActivityTypes();

  return activityTypes.map((type) => ({
    type,
    activity: activities.find((item) => item.description === type) ?? null,
  }));
};

export const getPrimaryTopics = async (): Promise<PrimaryTopic[]> => {
  if (topicsCache) return topicsCache;

  const data = await readJsonFile<{ topic?: TopicJsonRecord[] }>("topic.json");
  topicsCache = Array.isArray(data.topic) ? data.topic.map(normalizeTopic) : [];
  return topicsCache;
};

export const getPrimaryTopicsBySubject = async (
  subjectId: number | string,
): Promise<PrimaryTopic[]> => {
  const normalizedSubjectId = String(subjectId).trim();
  if (!normalizedSubjectId) return [];

  const topics = await getPrimaryTopics();
  return topics.filter((item) => String(item.gradeSubjectId ?? "") === normalizedSubjectId);
};
