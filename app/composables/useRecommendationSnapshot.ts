const ACTIVE_RECOMMENDATION_SNAPSHOT_ID_COOKIE =
  "activeRecommendationSnapshotId";
const ACTIVE_RECOMMENDATION_SNAPSHOT_GENERATED_AT_COOKIE =
  "activeRecommendationSnapshotGeneratedAt";

export const useRecommendationSnapshot = () => {
  const snapshotId = useCookie<string | null>(
    ACTIVE_RECOMMENDATION_SNAPSHOT_ID_COOKIE,
    {
      default: () => null,
      sameSite: "lax",
    },
  );
  const generatedAt = useCookie<string | null>(
    ACTIVE_RECOMMENDATION_SNAPSHOT_GENERATED_AT_COOKIE,
    {
      default: () => null,
      sameSite: "lax",
    },
  );

  const setActiveSnapshot = (nextSnapshotId: string, nextGeneratedAt: string) => {
    snapshotId.value = nextSnapshotId;
    generatedAt.value = nextGeneratedAt;
  };

  const clearActiveSnapshot = () => {
    snapshotId.value = null;
    generatedAt.value = null;
  };

  return {
    snapshotId,
    generatedAt,
    setActiveSnapshot,
    clearActiveSnapshot,
  };
};
