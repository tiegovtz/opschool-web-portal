export type ChapterActivityProgressState = {
  userId: string;
  chapterId: string;
  totalActivityIds: string[];
  attemptedActivityIds: string[];
  completedActivityIds: string[];
};

const ACTIVITY_ID_REGEX = /activity(?:Id)?="([^"]+)"/g;

const toUniqueIds = (values: Iterable<string>) =>
  Array.from(
    new Set(
      Array.from(values)
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );

export const createChapterActivityProgressState = (
  userId = "",
  chapterId = "",
  totalActivityIds: string[] = [],
): ChapterActivityProgressState => ({
  userId,
  chapterId,
  totalActivityIds: toUniqueIds(totalActivityIds),
  attemptedActivityIds: [],
  completedActivityIds: [],
});

export const extractActivityIdsFromContent = (content: unknown): string[] => {
  const source = String(content || "");

  return toUniqueIds(
    Array.from(source.matchAll(ACTIVITY_ID_REGEX)).map(([, activityId]) =>
      String(activityId || "").trim(),
    ),
  );
};

export const ensureChapterActivityProgressState = (
  currentState: ChapterActivityProgressState | null | undefined,
  userId: string,
  chapterId: string,
  totalActivityIds: string[],
): ChapterActivityProgressState => {
  const normalizedTotalActivityIds = toUniqueIds(totalActivityIds);

  if (
    !currentState ||
    currentState.userId !== userId ||
    currentState.chapterId !== chapterId
  ) {
    return createChapterActivityProgressState(
      userId,
      chapterId,
      normalizedTotalActivityIds,
    );
  }

  return {
    ...currentState,
    userId,
    chapterId,
    totalActivityIds: normalizedTotalActivityIds,
    attemptedActivityIds: toUniqueIds(currentState.attemptedActivityIds),
    completedActivityIds: toUniqueIds(currentState.completedActivityIds),
  };
};

export const appendTrackedActivityId = (
  ids: string[],
  activityId: string,
): string[] => toUniqueIds([...ids, activityId]);
