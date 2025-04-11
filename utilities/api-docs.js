const baseURL = "http://41.59.102.150:5001/v1"; // Define baseURL first

// const baseURL = "https://apitie.ekima.africa/v1" // Define baseURL first

// const baseURL = "http://127.0.0.1:3003/v1" // Define baseURL first

const apiDocs = {
  baseURL: baseURL, // You can include it here for reference

  // AUTH API
  auth: {
    // POST
    signUp: `${baseURL}/auth/sign-up`,
    login: `${baseURL}/auth/login`,
    chooseIdentity: `${baseURL}/auth/choose-identity`,
    refreshToken: `${baseURL}/auth/refresh-token`,
    invalidateToken: `${baseURL}/auth/invalidate-token`,
    requestCode: `${baseURL}/auth/request-code`,
    verifyCode: `${baseURL}/auth/verify-code`,
    forgotPassword: `${baseURL}/auth/forgot-password`,
    forgotPasswordStudent: `${baseURL}/auth/forgot-password-student`,
    resetPassword: `${baseURL}/auth/reset-password`,
    changePassword: `${baseURL}/auth/change-password`,
    userExists: `${baseURL}/auth/user-exists`,

    // GET
    profile: `${baseURL}/auth/profile`,

    // PATCH or PUT
    profileEdit: `${baseURL}/auth/profile/edit`,
  },

  // CHAPTERS API
  chapters: {
    getChapters: `${baseURL}/chapters`,
    getChapterId: `${baseURL}/chapters/:id`,
    getByTopicId: `${baseURL}/chapters/load-by-topic/{topicId}`,
    getTopicChapterQNs: `${baseURL}/questions/topic-chapter`,
  },

  // EXPERIMENTS API
  experiments: {
    getExperiments: `${baseURL}/experiments`,
    getExperimentId: `${baseURL}/experiments/:id`,
    getPublicExperiments: `${baseURL}/public-experiments`,
    getPublicExperimentsBySubjectId: `${baseURL}/public-experiments/by-subject/{subjectId}`,
  },

  // NOTES API
  notes: {
    getNotes: `${baseURL}/notes`,
  },

  // LEVELS API
  levels: {
    getLevels: `${baseURL}/levels`,
    getLevelId: `${baseURL}/levels/:id`,
  },

  // SUBJECTS API
  subjects: {
    getSubjects: `${baseURL}/subjects`,
    getSubjectId: `${baseURL}/subjects/:id`,
    getPublicSubjects: `${baseURL}/public-subjects`,
  },

  // TOPICS API
  topics: {
    getTopics: `${baseURL}/topics`,
    getTopicId: `${baseURL}/topics/:id`,
    getQuestionId: `${baseURL}/topics/{id}/questions`,
    getSubjectId: `${baseURL}/public-topics/by-subject/{subjectId}`,
    filterTopics: `${baseURL}/public-topics`,
    filterTopicsByUser: `${baseURL}/public-topics/{userId}`,
    topicViewedRead: `${baseURL}/topics/{id}/read`,
  },

  // VIDEO API 
  videos: {
    getStream: `${baseURL}/video-stream/`,
    getVideos: `${baseURL}/videos`,
    getVideoById: `${baseURL}/videos/{id}`,
    getPublicVideo: `${baseURL}/public-videos`,
    getPublicVideoBySubjectId: `${baseURL}/public-videos/by-subject/{subjectId}`,
  },

  //  PROGRESS TRACKING API
  progressTracking: {
    postProgress: `${baseURL}/progress`,
    getProgress: `${baseURL}/progress`,
    getProgresschapterId: `${baseURL}/progress/chapters/{chapterId}`,
    putProgresschapterId: `${baseURL}/progress/chapters/{chapterId}`,
    putProgresschapterIdVideoProgress : `${baseURL}/progress/chapters/{chapterId}/video-progress`,
  }

}

export default apiDocs;