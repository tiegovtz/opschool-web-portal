export default {
  setup() {
    const { $BASE_API_URL } = useNuxtApp();
    return {
      baseURL: `${$BASE_API_URL}`, // You can include it here for reference

      // AUTH API
      auth: {
        // POST
        signUp: `${$BASE_API_URL}/auth/sign-up`,
        login: `${$BASE_API_URL}/auth/login`,
        chooseIdentity: `${$BASE_API_URL}/auth/choose-identity`,
        refreshToken: `${$BASE_API_URL}/auth/refresh-token`,
        invalidateToken: `${$BASE_API_URL}/auth/invalidate-token`,
        requestCode: `${$BASE_API_URL}/auth/request-code`,
        verifyCode: `${$BASE_API_URL}/auth/verify-code`,
        forgotPassword: `${$BASE_API_URL}/auth/forgot-password`,
        forgotPasswordStudent: `${$BASE_API_URL}/auth/forgot-password-student`,
        resetPassword: `${$BASE_API_URL}/auth/reset-password`,
        changePassword: `${$BASE_API_URL}/auth/change-password`,
        userExists: `${$BASE_API_URL}/auth/user-exists`,

        // GET
        profile: `${$BASE_API_URL}/auth/profile`,

        // PATCH or PUT
        profileEdit: `${$BASE_API_URL}/auth/profile/edit`,
      },

      // CHAPTERS API
      chapters: {
        getChapters: `${$BASE_API_URL}/chapters`,
        getChapterId: `${$BASE_API_URL}/chapters/:id`,
        getByTopicId: `${$BASE_API_URL}/chapters/load-by-topic/{topicId}`,
        getTopicChapterQNs: `${$BASE_API_URL}/questions/topic-chapter`,
      },

      // EXPERIMENTS API
      experiments: {
        getExperimentId: `${$BASE_API_URL}/experiments/:id`,
      },

      // LEVELS API
      levels: {
        getLevels: `${$BASE_API_URL}/levels`,
        getLevelId: `${$BASE_API_URL}/levels/:id`,
      },

      // SUBJECTS API
      subjects: {
        getSubjects: `${$BASE_API_URL}/subjects`,
        getSubjectId: `${$BASE_API_URL}/subjects/:id`,
      },

      // TOPICS API
      topics: {
        getTopics: `${$BASE_API_URL}/topics`,
        getTopicId: `${$BASE_API_URL}/topics/:id`,
        getQuestionId: `${$BASE_API_URL}/topics/{id}/questions`,
        getSubjectId: `${$BASE_API_URL}/topics/by-subject/{subjectId}`,
        filterTopics: `${$BASE_API_URL}/public-topics`,
        filterTopicsByUser: `${$BASE_API_URL}/public-topics/{userId}`,
        topicViewedRead: `${$BASE_API_URL}/topics/{id}/read`,
      },

      // VIDEO API
      videos: {
        getStream: `${$BASE_API_URL}/video-stream/`,
        getVideos: `${$BASE_API_URL}/videos`,
        getVideoById: `${$BASE_API_URL}/videos/{id}`,
      },

      //  PROGRESS
      progress: {
        video: `${$BASE_API_URL}/progress/video`,
        notes: `${$BASE_API_URL}/progress/notes`,
      },
    };
  },
};
