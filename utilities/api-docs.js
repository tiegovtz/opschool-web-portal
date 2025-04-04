// This file contains the API endpoints for the application.

import { _BASE_API_URL } from "./controlls.js"; // Import the _BASE_API_URL from controlls.js

export default {
  setup() {
    let BASE_API_URL;
    // Check if the code is running on the client-side or server-side
    // and set the BASE_API_URL accordingly
    // In Nuxt 3, you can use the `useNuxtApp` function to access the app context
    // and retrieve the environment variable for the API URL
    if(_BASE_API_URL.value){
        BASE_API_URL = _BASE_API_URL.value // Use the value from the controlls.js file
    }
    else{
      const { $BASE_API_URL } = useNuxtApp(); 
      BASE_API_URL=$BASE_API_URL
    }

    return {
      baseURL: `${BASE_API_URL}`, // You can include it here for reference

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
    getExperimentId: `${baseURL}/experiments/:id`,
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
  },

  // TOPICS API
  topics: {
    getTopics: `${baseURL}/topics`,
    getTopicId: `${baseURL}/topics/:id`,
    getQuestionId: `${baseURL}/topics/{id}/questions`,
    getSubjectId: `${baseURL}/topics/by-subject/{subjectId}`,
    filterTopics: `${baseURL}/public-topics`,
    filterTopicsByUser: `${baseURL}/public-topics/{userId}`,
    topicViewedRead: `${baseURL}/topics/{id}/read`,
  },

  // VIDEO API 
  videos: {
    getStream: `${baseURL}/video-stream/`,
    getVideos: `${baseURL}/videos`,
    getVideoById: `${baseURL}/videos/{id}`,
  },

  //  PROGRESS
  progress: {
    video: `${baseURL}/progress/video`,
    notes: `${baseURL}/progress/notes`
  }

}

export default apiDocs;