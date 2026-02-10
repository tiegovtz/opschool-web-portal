const baseURL =
  import.meta.env?.VITE_API_BASE_URL || "https://opschool.tie.go.tz:5001/v1";

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
    updateTimeSpent: `${baseURL}/auth/update-time-spent`, // Update time spent on the platform
    profilePicture: `${baseURL}/auth/profile/update-picture`,
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

  // education level
  educationLevel: {
    getEducationLevels: `${baseURL}/education-levels`,
    getEducationLevelId: `${baseURL}/education-levels/:id`,
  },

  // languages API
  languages: {
    getLanguages: `${baseURL}/languages`,
    getLanguageId: `${baseURL}/languages/:id`,
  },

  // skills API
  skills: {
    getSkills: `${baseURL}/skills`,
    getSkillId: `${baseURL}/skills/:id`,
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
    publicTopicsFilterAll: `${baseURL}/public-topics/filter-all`,
    topicViewedRead: `${baseURL}/topics/{id}/read`,
  },

  // VIDEO API
  videos: {
    getStream: `${baseURL}/video-stream/`,
    getVideos: `${baseURL}/videos`,
    getVideoById: `${baseURL}/videos/{id}`,
    getPublicVideo: `${baseURL}/public-videos`,
    getPublicVideoBySubjectId: `${baseURL}/public-videos/by-subject/{subjectId}`,

    // Interactions
    getVideoInteractions: `${baseURL}/video-interactions/{id}`,
    getVideoInteractionsLoad: `${baseURL}/video-interactions/load-by-video/{id}`,
  },

  //  PROGRESS TRACKING API
  progressTracking: {
    postProgress: `${baseURL}/progress`,
    getProgress: `${baseURL}/progress`,
    getProgresschapterId: `${baseURL}/progress/chapters/{chapterId}`,
    putProgresschapterId: `${baseURL}/progress/chapters/{chapterId}`,
    putProgresschapterIdVideoProgress: `${baseURL}/progress/chapters/{chapterId}/video-progress`,
    putProgresschapterIdNotesProgress: `${baseURL}/progress/chapters/{chapterId}/notes-progress`,
    postProgresschapterIdExperimentAttempts: `${baseURL}/progress/chapters/{chapterId}/experiment-attempts`,
    postQuizAssessment: `${baseURL}/progress/chapters/{chapterId}/assessment-attempts`,
    getProgressSubjectsSubjectId: `${baseURL}/progress/subjects/{subjectId}`,
    getProgressTopicsTopicId: `${baseURL}/progress/topics/{topicId}`,
  },

  // audio API
  audio: {
    getPublicAudio: `${baseURL}/public-audios`,
    getPublicAudioBySubjectId: `${baseURL}/public-audios/by-subject/{subjectId}`,
    streamAudio: `${baseURL}/audio-stream/{id}`,
    getById: `${baseURL}/audios/{id}`,
  },

  // Visitors
  visitors: {
    postVisitors: `${baseURL}/visitors`,
  },

  // Search
  search: {
    getSearch: `${baseURL}/search`,
    aiSearch: `/api/ai/search`, // Nuxt server API route
  },

  // Machine Learning API
  machineLearning: {
    searchBookEmbeddings: `${baseURL}/machine-learning/books/embeddings/search`,
  },

  // Chat History API
  chat: {
    createSession: `${baseURL}/chat/sessions`,
    getSessions: `${baseURL}/chat/sessions`,
    getSession: `${baseURL}/chat/sessions/:id`,
    updateSession: `${baseURL}/chat/sessions/:id`,
    deleteSession: `${baseURL}/chat/sessions/:id`,
    addMessage: `${baseURL}/chat/sessions/:id/messages`,
    getMessages: `${baseURL}/chat/sessions/:id/messages`,
    enforceRetention: `${baseURL}/chat/retention/enforce`,
  },

  // School
  school: {
    get: `${baseURL}/schools`,
    getSchoolRegions: `${baseURL}/schools/regions`,
    getSchoolDistricts: (region: string): string =>
      `${baseURL}/schools/districts/${region}`,
    // getSchools: `${baseURL}/schools`,
    // getSchoolId: `${baseURL}/schools/:id`,
    // searchSchools: `${baseURL}/schools/search`,
  },

  // Live classrooms
  liveClassrooms: {
    sessions: `${baseURL}/live-classrooms/sessions`,
    recordedSessions: `${baseURL}/live-classrooms/recorded-sessions`,
    streamingLinks: `${baseURL}/live-classrooms/streaming-links`,
    session: `${baseURL}/live-classrooms/sessions`,
  },
};

export default apiDocs;
