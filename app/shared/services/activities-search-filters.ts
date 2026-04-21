import { computed } from "vue";
import apiDocs from "~/utilities/apiDocs";
import { getApiEducationLevelName } from "~/utilities/educationRoute";

type SubjectRecord = {
  id: number;
  name?: string;
  subjectName?: string;
};

type TopicRecord = {
  id: number;
  name?: string;
  title?: string;
  topicName?: string;
};

type GradeRecord = {
  gradeId: number;
  gradeName: string;
};

type CurriculumRecord = {
  id: number | string;
  name: string;
};

const authHeaders = () => {
  const token = useCookie("signInAccessToken").value;
  return token
    ? ({ Authorization: `Bearer ${token}` } as Record<string, string>)
    : undefined;
};

export const useSubjects = (_curriculum = "TET", _gradeId?: number) => {
  const { data, pending } = useFetch<SubjectRecord[]>(apiDocs.subjects.getPublicSubjects, {
    headers: authHeaders(),
    query: computed(() => ({
      educationLevel: getApiEducationLevelName("primary"),
    })),
    default: () => [],
  });

  const subjects = computed(() =>
    (data.value || []).map((subject) => ({
      ...subject,
      subjectName: subject.subjectName || subject.name || "",
    })),
  );

  return {
    subjects,
    subjectsLoading: pending,
  };
};

export const useTopics = (
  _curriculum = "TET",
  subjectId?: number,
  _gradeId?: number,
) => {
  const url = computed<string | null>(() =>
    subjectId
      ? apiDocs.topics.getSubjectId.replace("{subjectId}", String(subjectId))
      : null,
  );

  const { data, pending } = useFetch<TopicRecord[]>(() => url.value ?? "", {
    headers: authHeaders(),
    default: () => [] as TopicRecord[],
    immediate: !!url.value,
  });

  const topics = computed(() =>
    ((data.value ?? []) as TopicRecord[]).map((topic: TopicRecord) => ({
      ...topic,
      topicName: topic.topicName || topic.title || topic.name || "",
    })),
  );

  return {
    topics,
    topicsLoading: pending,
  };
};

export const useGrades = (_curriculum = "TET", _context?: string) => {
  const grades = computed<GradeRecord[]>(() => []);
  const gradesLoading = computed(() => false);
  return { grades, gradesLoading };
};

export const useCurriculums = () => {
  const curriculums = computed<CurriculumRecord[]>(() => []);
  const curriculumsLoading = computed(() => false);
  return { curriculums, curriculumsLoading };
};
